using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using FluentAssertions;
using JobAutomation.Api.Data;
using JobAutomation.Api.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Xunit;

namespace JobAutomation.Tests;

public class WorkerConcurrencyTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly CustomWebApplicationFactory _factory;

    public WorkerConcurrencyTests(CustomWebApplicationFactory factory)
    {
        _factory = factory;
    }

    [Fact]
    public async Task MultipleWorkers_PickUpSameQueuedJob_OnlyOneSucceeds()
    {
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        
        var user = new User { Email = Guid.NewGuid().ToString() + "@test.com" };
        db.Users.Add(user);
        
        var job = new Job
        {
            UserId = user.Id,
            Name = "Concurrency Job",
            JobType = "noop"
        };
        db.Jobs.Add(job);
        
        var execId = Guid.NewGuid();
        var exec = new Execution
        {
            Id = execId,
            JobId = job.Id,
            Status = "queued"
        };
        db.Executions.Add(exec);
        await db.SaveChangesAsync();

        int workers = 3;
        var tasks = new List<Task<Guid?>>();
        
        for (int i = 0; i < workers; i++)
        {
            tasks.Add(Task.Run(async () =>
            {
                using var innerScope = _factory.Services.CreateScope();
                var innerDb = innerScope.ServiceProvider.GetRequiredService<AppDbContext>();
                
                await using var tx = await innerDb.Database.BeginTransactionAsync();
                try
                {
                    var sql = @"
                        SELECT ""Id"" 
                        FROM ""Executions""
                        WHERE ""Status"" = 'queued' AND ""Id"" = @id
                          AND (""LockedUntil"" IS NULL OR ""LockedUntil"" < NOW())
                        FOR UPDATE SKIP LOCKED;";
                    
                    var conn = innerDb.Database.GetDbConnection();
                    using var cmd = conn.CreateCommand();
                    cmd.CommandText = sql;
                    cmd.Transaction = tx.GetDbTransaction();
                    
                    var idParam = cmd.CreateParameter();
                    idParam.ParameterName = "@id";
                    idParam.Value = execId;
                    cmd.Parameters.Add(idParam);
                    
                    var result = await cmd.ExecuteScalarAsync();
                    if (result != null && result != DBNull.Value)
                    {
                        var updateSql = @"UPDATE ""Executions"" SET ""Status"" = 'running', ""LockedUntil"" = NOW() + INTERVAL '30 seconds' WHERE ""Id"" = @id;";
                        using var updateCmd = conn.CreateCommand();
                        updateCmd.CommandText = updateSql;
                        updateCmd.Transaction = tx.GetDbTransaction();
                        updateCmd.Parameters.Add(idParam);
                        await updateCmd.ExecuteNonQueryAsync();
                        await tx.CommitAsync();
                        return (Guid)result;
                    }
                    return (Guid?)null;
                }
                catch
                {
                    await tx.RollbackAsync();
                    return null;
                }
            }));
        }

        var results = await Task.WhenAll(tasks);
        
        var successCount = results.Count(r => r.HasValue);
        successCount.Should().Be(1, "Only one worker should acquire the job");
    }
}

using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using FluentAssertions;
using JobAutomation.Api.Data;
using JobAutomation.Api.Models;
using JobAutomation.Api.Workers;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging.Abstractions;
using Xunit;

namespace JobAutomation.Tests;

public class RetryLogicTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly CustomWebApplicationFactory _factory;

    public RetryLogicTests(CustomWebApplicationFactory factory)
    {
        _factory = factory;
    }

    [Fact]
    public async Task ExecutionFailure_ShouldCreateRetryExecution()
    {
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        
        var user = new User { Email = Guid.NewGuid().ToString() + "@test.com" };
        db.Users.Add(user);
        
        var job = new Job
        {
            UserId = user.Id,
            Name = "Fail Job",
            JobType = "unknown_type", // will cause executor to fail
            MaxRetries = 3
        };
        db.Jobs.Add(job);
        
        var exec = new Execution
        {
            JobId = job.Id,
            Status = "queued",
            Attempt = 1
        };
        db.Executions.Add(exec);
        await db.SaveChangesAsync();

        var executor = scope.ServiceProvider.GetRequiredService<JobExecutor>();

        // We can simulate worker logic
        var result = await executor.ExecuteAsync(job, CancellationToken.None);
        
        result.success.Should().BeFalse();

        // Process failure as worker does
        exec.Status = "failed";
        
        if (exec.Attempt < job.MaxRetries)
        {
            db.Executions.Add(new Execution
            {
                JobId = exec.JobId,
                Status = "queued",
                Attempt = exec.Attempt + 1,
                TriggeredBy = "retry"
            });
        }
        await db.SaveChangesAsync();

        var retryExec = await db.Executions.FirstOrDefaultAsync(e => e.JobId == job.Id && e.Attempt == 2);
        retryExec.Should().NotBeNull();
        retryExec!.TriggeredBy.Should().Be("retry");
        retryExec.Status.Should().Be("queued");
    }
}

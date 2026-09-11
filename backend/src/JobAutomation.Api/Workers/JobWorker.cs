using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using JobAutomation.Api.Data;
using JobAutomation.Api.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace JobAutomation.Api.Workers;

public class JobWorker : BackgroundService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<JobWorker> _logger;
    private readonly IConfiguration _config;
    private readonly string _workerId;

    public JobWorker(IServiceProvider serviceProvider, ILogger<JobWorker> logger, IConfiguration config)
    {
        _serviceProvider = serviceProvider;
        _logger = logger;
        _config = config;
        _workerId = Guid.NewGuid().ToString("N");
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        int concurrency = _config.GetValue<int>("WORKER_CONCURRENCY", 3);
        var tasks = Enumerable.Range(0, concurrency).Select(_ => WorkerLoopAsync(stoppingToken)).ToArray();
        await Task.WhenAll(tasks);
    }

    private async Task WorkerLoopAsync(CancellationToken stoppingToken)
    {
        int pollInterval = _config.GetValue<int>("WORKER_POLL_INTERVAL_MS", 2000);

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                var executionId = await TryAcquireJobAsync(stoppingToken);

                if (executionId != null)
                {
                    await ProcessJobAsync(executionId.Value, stoppingToken);
                }
                else
                {
                    await Task.Delay(pollInterval, stoppingToken);
                }
            }
            catch (OperationCanceledException)
            {
                break;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in worker loop.");
                await Task.Delay(pollInterval, stoppingToken);
            }
        }
    }

    private async Task<Guid?> TryAcquireJobAsync(CancellationToken stoppingToken)
    {
        using var scope = _serviceProvider.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        await using var transaction = await dbContext.Database.BeginTransactionAsync(stoppingToken);

        try
        {
            // Lock and get the next job
            var sql = @"
                SELECT ""Id"" 
                FROM ""Executions""
                WHERE ""Status"" = 'queued'
                  AND (""LockedUntil"" IS NULL OR ""LockedUntil"" < NOW())
                ORDER BY ""CreatedAt""
                LIMIT 1
                FOR UPDATE SKIP LOCKED;";

            var dbConnection = dbContext.Database.GetDbConnection();
            using var command = dbConnection.CreateCommand();
            command.CommandText = sql;
            command.Transaction = transaction.GetDbTransaction();

            var result = await command.ExecuteScalarAsync(stoppingToken);

            if (result != null && result != DBNull.Value)
            {
                Guid executionId = (Guid)result;
                
                var updateSql = @"
                    UPDATE ""Executions"" 
                    SET ""Status"" = 'running', 
                        ""WorkerId"" = @workerId, 
                        ""LockedUntil"" = NOW() + INTERVAL '30 seconds', 
                        ""StartedAt"" = NOW() 
                    WHERE ""Id"" = @id;";
                
                using var updateCmd = dbConnection.CreateCommand();
                updateCmd.CommandText = updateSql;
                updateCmd.Transaction = transaction.GetDbTransaction();
                
                var workerIdParam = updateCmd.CreateParameter();
                workerIdParam.ParameterName = "@workerId";
                workerIdParam.Value = _workerId;
                updateCmd.Parameters.Add(workerIdParam);
                
                var idParam = updateCmd.CreateParameter();
                idParam.ParameterName = "@id";
                idParam.Value = executionId;
                updateCmd.Parameters.Add(idParam);
                
                await updateCmd.ExecuteNonQueryAsync(stoppingToken);
                await transaction.CommitAsync(stoppingToken);

                return executionId;
            }

            return null;
        }
        catch
        {
            await transaction.RollbackAsync(stoppingToken);
            throw;
        }
    }

    private async Task ProcessJobAsync(Guid executionId, CancellationToken stoppingToken)
    {
        using var scope = _serviceProvider.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var executor = scope.ServiceProvider.GetRequiredService<JobExecutor>();

        // Load execution with job tracking
        var execution = await dbContext.Executions
            .Include(e => e.Job)
            .FirstOrDefaultAsync(e => e.Id == executionId, stoppingToken);

        if (execution == null) return;

        using var cts = CancellationTokenSource.CreateLinkedTokenSource(stoppingToken);
        var heartbeatTask = HeartbeatAsync(executionId, cts.Token);

        try
        {
            var result = await executor.ExecuteAsync(execution.Job, cts.Token);

            execution.Status = result.success ? "succeeded" : "failed";
            execution.FinishedAt = DateTime.UtcNow;
            execution.DurationMs = result.durationMs;
            execution.Logs = result.logs;
            execution.ErrorMessage = result.errorMessage;
            execution.LockedUntil = null;

            if (!result.success && execution.Attempt < execution.Job.MaxRetries)
            {
                var retryExecution = new Execution
                {
                    JobId = execution.JobId,
                    Status = "queued",
                    Attempt = execution.Attempt + 1,
                    TriggeredBy = "retry"
                };
                dbContext.Executions.Add(retryExecution);
            }

            await dbContext.SaveChangesAsync(stoppingToken);
        }
        finally
        {
            cts.Cancel();
            try { await heartbeatTask; } catch { /* ignore heartbeat cancel */ }
        }
    }

    private async Task HeartbeatAsync(Guid executionId, CancellationToken token)
    {
        while (!token.IsCancellationRequested)
        {
            try
            {
                await Task.Delay(TimeSpan.FromSeconds(15), token);

                using var scope = _serviceProvider.CreateScope();
                var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();

                var execution = await dbContext.Executions.FindAsync(new object[] { executionId }, token);
                if (execution != null && execution.Status == "running")
                {
                    execution.LockedUntil = DateTime.UtcNow.AddSeconds(30);
                    await dbContext.SaveChangesAsync(token);
                }
            }
            catch (OperationCanceledException) { }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to update heartbeat for execution {ExecutionId}", executionId);
            }
        }
    }
}

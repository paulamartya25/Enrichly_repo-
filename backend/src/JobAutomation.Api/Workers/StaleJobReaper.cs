using System;
using System.Threading;
using System.Threading.Tasks;
using JobAutomation.Api.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace JobAutomation.Api.Workers;

public class StaleJobReaper : BackgroundService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<StaleJobReaper> _logger;

    public StaleJobReaper(IServiceProvider serviceProvider, ILogger<StaleJobReaper> logger)
    {
        _serviceProvider = serviceProvider;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                using var scope = _serviceProvider.CreateScope();
                var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
                
                var staleThreshold = DateTime.UtcNow;

                var staleExecutions = await dbContext.Executions
                    .Where(e => e.Status == "running" && e.LockedUntil != null && e.LockedUntil < staleThreshold)
                    .ToListAsync(stoppingToken);

                foreach (var execution in staleExecutions)
                {
                    _logger.LogWarning("Execution {ExecutionId} is stale. Re-queuing.", execution.Id);
                    execution.Status = "queued";
                    execution.LockedUntil = null;
                    execution.WorkerId = null;
                }

                if (staleExecutions.Count > 0)
                {
                    await dbContext.SaveChangesAsync(stoppingToken);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while reaping stale jobs.");
            }

            await Task.Delay(TimeSpan.FromSeconds(60), stoppingToken);
        }
    }
}

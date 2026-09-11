using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using JobAutomation.Api.Data;
using JobAutomation.Api.DTOs.Executions;
using JobAutomation.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace JobAutomation.Api.Services;

public interface IExecutionService
{
    Task<List<ExecutionResponse>> GetExecutionsAsync(Guid userId, Guid? jobId, string? status, int page, int pageSize);
    Task<ExecutionResponse?> GetExecutionAsync(Guid userId, Guid executionId);
    Task<bool> CancelExecutionAsync(Guid userId, Guid executionId);
    Task<ExecutionResponse?> RetryExecutionAsync(Guid userId, Guid executionId);
}

public class ExecutionService : IExecutionService
{
    private readonly AppDbContext _context;

    public ExecutionService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<List<ExecutionResponse>> GetExecutionsAsync(Guid userId, Guid? jobId, string? status, int page, int pageSize)
    {
        var query = _context.Executions
            .Include(e => e.Job)
            .Where(e => e.Job.UserId == userId);
            
        if (jobId.HasValue)
            query = query.Where(e => e.JobId == jobId.Value);
            
        if (!string.IsNullOrEmpty(status))
            query = query.Where(e => e.Status == status);

        var executions = await query
            .OrderByDescending(e => e.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();
            
        return executions.Select(MapToResponse).ToList();
    }

    public async Task<ExecutionResponse?> GetExecutionAsync(Guid userId, Guid executionId)
    {
        var execution = await _context.Executions
            .Include(e => e.Job)
            .FirstOrDefaultAsync(e => e.Id == executionId && e.Job.UserId == userId);
            
        return execution == null ? null : MapToResponse(execution);
    }

    public async Task<bool> CancelExecutionAsync(Guid userId, Guid executionId)
    {
        var execution = await _context.Executions
            .Include(e => e.Job)
            .FirstOrDefaultAsync(e => e.Id == executionId && e.Job.UserId == userId);
            
        if (execution == null) return false;
        if (execution.Status != "queued") return false;

        execution.Status = "cancelled";
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<ExecutionResponse?> RetryExecutionAsync(Guid userId, Guid executionId)
    {
        var execution = await _context.Executions
            .Include(e => e.Job)
            .FirstOrDefaultAsync(e => e.Id == executionId && e.Job.UserId == userId);
            
        if (execution == null) return null;
        if (execution.Status == "queued" || execution.Status == "running") return null;

        var newExecution = new Execution
        {
            JobId = execution.JobId,
            Status = "queued",
            Attempt = execution.Attempt + 1,
            TriggeredBy = "retry"
        };
        
        _context.Executions.Add(newExecution);
        await _context.SaveChangesAsync();
        return MapToResponse(newExecution);
    }

    private static ExecutionResponse MapToResponse(Execution e) => new ExecutionResponse
    {
        Id = e.Id,
        JobId = e.JobId,
        Status = e.Status,
        Attempt = e.Attempt,
        TriggeredBy = e.TriggeredBy,
        StartedAt = e.StartedAt,
        FinishedAt = e.FinishedAt,
        DurationMs = e.DurationMs,
        ErrorMessage = e.ErrorMessage,
        Logs = e.Logs,
        CreatedAt = e.CreatedAt
    };
}

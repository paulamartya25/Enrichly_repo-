using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using JobAutomation.Api.Data;
using JobAutomation.Api.DTOs.Jobs;
using JobAutomation.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace JobAutomation.Api.Services;

public interface IJobService
{
    Task<List<JobResponse>> GetJobsAsync(Guid userId, string? search, bool? isEnabled);
    Task<JobResponse?> GetJobAsync(Guid userId, Guid jobId);
    Task<JobResponse> CreateJobAsync(Guid userId, CreateJobRequest request);
    Task<JobResponse?> UpdateJobAsync(Guid userId, Guid jobId, UpdateJobRequest request);
    Task<bool> DeleteJobAsync(Guid userId, Guid jobId);
    Task<Guid?> TriggerJobAsync(Guid userId, Guid jobId);
}

public class JobService : IJobService
{
    private readonly AppDbContext _context;

    public JobService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<List<JobResponse>> GetJobsAsync(Guid userId, string? search, bool? isEnabled)
    {
        var query = _context.Jobs.Where(j => j.UserId == userId);
        
        if (!string.IsNullOrEmpty(search))
            query = query.Where(j => j.Name.Contains(search) || (j.Description != null && j.Description.Contains(search)));
            
        if (isEnabled.HasValue)
            query = query.Where(j => j.IsEnabled == isEnabled.Value);

        var jobs = await query.ToListAsync();
        return jobs.Select(MapToResponse).ToList();
    }

    public async Task<JobResponse?> GetJobAsync(Guid userId, Guid jobId)
    {
        var job = await _context.Jobs.FirstOrDefaultAsync(j => j.Id == jobId && j.UserId == userId);
        return job == null ? null : MapToResponse(job);
    }

    public async Task<JobResponse> CreateJobAsync(Guid userId, CreateJobRequest request)
    {
        var job = new Job
        {
            UserId = userId,
            Name = request.Name,
            Description = request.Description,
            JobType = request.JobType,
            Config = request.Config,
            CronExpression = request.CronExpression,
            MaxRetries = request.MaxRetries,
            RetryDelaySeconds = request.RetryDelaySeconds,
            IsEnabled = request.IsEnabled
        };

        _context.Jobs.Add(job);
        await _context.SaveChangesAsync();
        return MapToResponse(job);
    }

    public async Task<JobResponse?> UpdateJobAsync(Guid userId, Guid jobId, UpdateJobRequest request)
    {
        var job = await _context.Jobs.FirstOrDefaultAsync(j => j.Id == jobId && j.UserId == userId);
        if (job == null) return null;

        job.Name = request.Name;
        job.Description = request.Description;
        job.JobType = request.JobType;
        job.Config = request.Config;
        job.CronExpression = request.CronExpression;
        job.MaxRetries = request.MaxRetries;
        job.RetryDelaySeconds = request.RetryDelaySeconds;
        job.IsEnabled = request.IsEnabled;
        job.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return MapToResponse(job);
    }

    public async Task<bool> DeleteJobAsync(Guid userId, Guid jobId)
    {
        var job = await _context.Jobs.FirstOrDefaultAsync(j => j.Id == jobId && j.UserId == userId);
        if (job == null) return false;

        _context.Jobs.Remove(job);
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<Guid?> TriggerJobAsync(Guid userId, Guid jobId)
    {
        var job = await _context.Jobs.FirstOrDefaultAsync(j => j.Id == jobId && j.UserId == userId);
        if (job == null) return null;

        var existingExecution = await _context.Executions
            .FirstOrDefaultAsync(e => e.JobId == jobId && (e.Status == "queued" || e.Status == "running"));
            
        if (existingExecution != null)
            return existingExecution.Id; // idempotent return

        var execution = new Execution
        {
            JobId = jobId,
            Status = "queued",
            Attempt = 1,
            TriggeredBy = "manual"
        };
        
        _context.Executions.Add(execution);
        await _context.SaveChangesAsync();
        
        // Broadcast new execution event? handled by db polling or direct sse integration in a larger app
        return execution.Id;
    }

    private static JobResponse MapToResponse(Job j) => new JobResponse
    {
        Id = j.Id,
        Name = j.Name,
        Description = j.Description,
        JobType = j.JobType,
        Config = j.Config,
        CronExpression = j.CronExpression,
        MaxRetries = j.MaxRetries,
        RetryDelaySeconds = j.RetryDelaySeconds,
        IsEnabled = j.IsEnabled,
        CreatedAt = j.CreatedAt,
        UpdatedAt = j.UpdatedAt
    };
}

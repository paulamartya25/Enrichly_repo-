using System;
using System.Text.Json;

namespace JobAutomation.Api.DTOs.Jobs;

public class CreateJobRequest
{
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string JobType { get; set; } = "http";
    public JsonDocument Config { get; set; } = JsonDocument.Parse("{}");
    public string? CronExpression { get; set; }
    public int MaxRetries { get; set; } = 3;
    public int RetryDelaySeconds { get; set; } = 60;
    public bool IsEnabled { get; set; } = true;
}

public class UpdateJobRequest
{
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string JobType { get; set; } = "http";
    public JsonDocument Config { get; set; } = JsonDocument.Parse("{}");
    public string? CronExpression { get; set; }
    public int MaxRetries { get; set; }
    public int RetryDelaySeconds { get; set; }
    public bool IsEnabled { get; set; }
}

public class JobResponse
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string JobType { get; set; } = string.Empty;
    public JsonDocument Config { get; set; } = null!;
    public string? CronExpression { get; set; }
    public int MaxRetries { get; set; }
    public int RetryDelaySeconds { get; set; }
    public bool IsEnabled { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

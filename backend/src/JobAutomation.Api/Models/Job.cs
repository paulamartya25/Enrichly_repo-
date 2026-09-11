using System;
using System.Collections.Generic;
using System.Text.Json;

namespace JobAutomation.Api.Models;

public class Job
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public User User { get; set; } = null!;
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string JobType { get; set; } = "http"; // "http", "webhook", "noop"
    public JsonDocument Config { get; set; } = JsonDocument.Parse("{}"); // { url, method, headers, body }
    public string? CronExpression { get; set; } // null = manual only
    public int MaxRetries { get; set; } = 3;
    public int RetryDelaySeconds { get; set; } = 60;
    public bool IsEnabled { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    public ICollection<Execution> Executions { get; set; } = [];
}

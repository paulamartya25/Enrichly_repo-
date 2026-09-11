using System;

namespace JobAutomation.Api.DTOs.Executions;

public class TriggerExecutionRequest
{
    // currently empty or optional parameters
}

public class ExecutionResponse
{
    public Guid Id { get; set; }
    public Guid JobId { get; set; }
    public string Status { get; set; } = string.Empty;
    public int Attempt { get; set; }
    public string TriggeredBy { get; set; } = string.Empty;
    public DateTime? StartedAt { get; set; }
    public DateTime? FinishedAt { get; set; }
    public long? DurationMs { get; set; }
    public string? ErrorMessage { get; set; }
    public string? Logs { get; set; }
    public DateTime CreatedAt { get; set; }
}

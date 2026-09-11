using System;

namespace JobAutomation.Api.Models;

public class Execution
{
    public Guid Id { get; set; }
    public Guid JobId { get; set; }
    public Job Job { get; set; } = null!;
    public string Status { get; set; } = "queued"; // queued | running | succeeded | failed | cancelled
    public int Attempt { get; set; } = 1;
    public string TriggeredBy { get; set; } = "manual"; // manual | scheduler | retry
    public DateTime? StartedAt { get; set; }
    public DateTime? FinishedAt { get; set; }
    public long? DurationMs { get; set; }
    public string? ErrorMessage { get; set; }
    public string? Logs { get; set; }
    public string? WorkerId { get; set; }
    public DateTime? LockedUntil { get; set; } // heartbeat-based locking
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

using System;
using System.Security.Claims;
using System.Threading;
using System.Threading.Tasks;
using JobAutomation.Api.Data;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace JobAutomation.Api.Endpoints;

public static class SseEndpoints
{
    public static void MapSseEndpoints(this IEndpointRouteBuilder routes)
    {
        routes.MapGet("/api/executions/stream", async (HttpContext context, ClaimsPrincipal user) =>
        {
            var userIdClaim = user.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var userId))
            {
                context.Response.StatusCode = 401;
                return;
            }

            context.Response.Headers.Append("Content-Type", "text/event-stream");
            context.Response.Headers.Append("Cache-Control", "no-cache");
            context.Response.Headers.Append("Connection", "keep-alive");

            var dbContextFactory = context.RequestServices.GetRequiredService<IDbContextFactory<AppDbContext>>();

            while (!context.RequestAborted.IsCancellationRequested)
            {
                // Simple polling mechanism for SSE updates.
                // In a production app, use an in-memory channel or Redis pub/sub.
                using var dbContext = await dbContextFactory.CreateDbContextAsync();
                
                var recentExecutions = await dbContext.Executions
                    .Include(e => e.Job)
                    .Where(e => e.Job.UserId == userId && e.CreatedAt >= DateTime.UtcNow.AddMinutes(-5))
                    .OrderByDescending(e => e.CreatedAt) // using CreatedAt since UpdatedAt is missing
                    .Take(10)
                    .Select(e => new { e.Id, e.Status, e.JobId })
                    .ToListAsync(context.RequestAborted);

                var data = System.Text.Json.JsonSerializer.Serialize(recentExecutions);
                await context.Response.WriteAsync($"data: {data}\n\n", context.RequestAborted);
                await context.Response.Body.FlushAsync(context.RequestAborted);

                await Task.Delay(5000, context.RequestAborted);
            }
        }).RequireAuthorization();
    }
}

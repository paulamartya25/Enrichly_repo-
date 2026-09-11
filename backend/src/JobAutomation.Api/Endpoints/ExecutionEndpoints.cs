using System;
using System.Security.Claims;
using JobAutomation.Api.Services;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Routing;

namespace JobAutomation.Api.Endpoints;

public static class ExecutionEndpoints
{
    public static void MapExecutionEndpoints(this IEndpointRouteBuilder routes)
    {
        var group = routes.MapGroup("/api/executions").WithTags("Executions").RequireAuthorization();

        group.MapGet("/", async (ClaimsPrincipal user, IExecutionService service, 
            [FromQuery] Guid? jobId, [FromQuery] string? status, [FromQuery] int page = 1, [FromQuery] int pageSize = 20) =>
        {
            var userId = Guid.Parse(user.FindFirstValue(ClaimTypes.NameIdentifier)!);
            return Results.Ok(await service.GetExecutionsAsync(userId, jobId, status, page, pageSize));
        });

        group.MapGet("/{id:guid}", async (ClaimsPrincipal user, IExecutionService service, Guid id) =>
        {
            var userId = Guid.Parse(user.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var exec = await service.GetExecutionAsync(userId, id);
            return exec != null ? Results.Ok(exec) : Results.NotFound();
        });

        group.MapPost("/{id:guid}/cancel", async (ClaimsPrincipal user, IExecutionService service, Guid id) =>
        {
            var userId = Guid.Parse(user.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var success = await service.CancelExecutionAsync(userId, id);
            return success ? Results.Ok(new { message = "Execution cancelled." }) : Results.BadRequest("Cannot cancel execution.");
        });

        group.MapPost("/{id:guid}/retry", async (ClaimsPrincipal user, IExecutionService service, Guid id) =>
        {
            var userId = Guid.Parse(user.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var exec = await service.RetryExecutionAsync(userId, id);
            return exec != null ? Results.Ok(exec) : Results.BadRequest("Cannot retry execution.");
        });
    }
}

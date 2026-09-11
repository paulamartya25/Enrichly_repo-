using System;
using System.Security.Claims;
using JobAutomation.Api.DTOs.Jobs;
using JobAutomation.Api.Services;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Routing;

namespace JobAutomation.Api.Endpoints;

public static class JobEndpoints
{
    public static void MapJobEndpoints(this IEndpointRouteBuilder routes)
    {
        var group = routes.MapGroup("/api/jobs").WithTags("Jobs").RequireAuthorization();

        group.MapGet("/", async (ClaimsPrincipal user, IJobService service, [FromQuery] string? search, [FromQuery] bool? isEnabled) =>
        {
            var userId = Guid.Parse(user.FindFirstValue(ClaimTypes.NameIdentifier)!);
            return Results.Ok(await service.GetJobsAsync(userId, search, isEnabled));
        });

        group.MapPost("/", async (ClaimsPrincipal user, IJobService service, CreateJobRequest request) =>
        {
            var userId = Guid.Parse(user.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var job = await service.CreateJobAsync(userId, request);
            return Results.Created($"/api/jobs/{job.Id}", job);
        });

        group.MapGet("/{id:guid}", async (ClaimsPrincipal user, IJobService service, Guid id) =>
        {
            var userId = Guid.Parse(user.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var job = await service.GetJobAsync(userId, id);
            return job != null ? Results.Ok(job) : Results.NotFound();
        });

        group.MapPut("/{id:guid}", async (ClaimsPrincipal user, IJobService service, Guid id, UpdateJobRequest request) =>
        {
            var userId = Guid.Parse(user.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var job = await service.UpdateJobAsync(userId, id, request);
            return job != null ? Results.Ok(job) : Results.NotFound();
        });

        group.MapDelete("/{id:guid}", async (ClaimsPrincipal user, IJobService service, Guid id) =>
        {
            var userId = Guid.Parse(user.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var success = await service.DeleteJobAsync(userId, id);
            return success ? Results.NoContent() : Results.NotFound();
        });

        group.MapPost("/{id:guid}/trigger", async (ClaimsPrincipal user, IJobService service, Guid id) =>
        {
            var userId = Guid.Parse(user.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var execId = await service.TriggerJobAsync(userId, id);
            return execId != null ? Results.Ok(new { executionId = execId }) : Results.NotFound();
        });
    }
}

using System.Security.Claims;
using JobAutomation.Api.DTOs.Auth;
using JobAutomation.Api.Services;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using System;
using System.Threading.Tasks;

namespace JobAutomation.Api.Endpoints;

public static class AuthEndpoints
{
    public static void MapAuthEndpoints(this IEndpointRouteBuilder routes)
    {
        var group = routes.MapGroup("/api/auth").WithTags("Auth");

        group.MapPost("/register", async (RegisterRequest req, IAuthService service) =>
        {
            try { return Results.Ok(await service.RegisterAsync(req)); }
            catch (Exception ex) { return Results.BadRequest(new { message = ex.Message }); }
        });

        group.MapPost("/login", async (LoginRequest req, IAuthService service) =>
        {
            try { return Results.Ok(await service.LoginAsync(req)); }
            catch (Exception ex) { return Results.BadRequest(new { message = ex.Message }); }
        });

        group.MapGet("/me", async (ClaimsPrincipal user, IAuthService service) =>
        {
            var userIdClaim = user.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var userId))
                return Results.Unauthorized();

            var me = await service.GetMeAsync(userId);
            return me != null ? Results.Ok(me) : Results.NotFound();
        }).RequireAuthorization();
    }
}

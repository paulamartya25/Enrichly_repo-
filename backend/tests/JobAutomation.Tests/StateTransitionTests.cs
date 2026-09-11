using System;
using System.Net;
using System.Net.Http.Json;
using System.Threading.Tasks;
using FluentAssertions;
using JobAutomation.Api.DTOs.Auth;
using JobAutomation.Api.DTOs.Jobs;
using JobAutomation.Api.Data;
using Microsoft.Extensions.DependencyInjection;
using Xunit;
using JobAutomation.Api.Models;

namespace JobAutomation.Tests;

public class StateTransitionTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly CustomWebApplicationFactory _factory;

    public StateTransitionTests(CustomWebApplicationFactory factory)
    {
        _factory = factory;
    }

    [Fact]
    public async Task CannotCancelRunningExecution()
    {
        var client = _factory.CreateClient();
        
        var reg = await client.PostAsJsonAsync("/api/auth/register", new { email = "state@test.com", password = "password" });
        var token = (await reg.Content.ReadFromJsonAsync<TokenResponse>())!.Token;
        client.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);

        var jobRes = await client.PostAsJsonAsync("/api/jobs", new CreateJobRequest { Name = "State Test", JobType = "noop" });
        var job = await jobRes.Content.ReadFromJsonAsync<JobResponse>();

        // Create a running execution manually for test
        Guid execId = Guid.NewGuid();
        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            db.Executions.Add(new Execution
            {
                Id = execId,
                JobId = job!.Id,
                Status = "running"
            });
            await db.SaveChangesAsync();
        }

        var cancelRes = await client.PostAsync($"/api/executions/{execId}/cancel", null);
        cancelRes.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }
}

using System;
using System.Net;
using System.Net.Http.Json;
using System.Threading.Tasks;
using FluentAssertions;
using JobAutomation.Api.DTOs.Auth;
using JobAutomation.Api.DTOs.Jobs;
using Xunit;

namespace JobAutomation.Tests;

public class AuthorizationTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly CustomWebApplicationFactory _factory;

    public AuthorizationTests(CustomWebApplicationFactory factory)
    {
        _factory = factory;
    }

    [Fact]
    public async Task UserCannotAccessOtherUsersJob()
    {
        var clientA = _factory.CreateClient();
        var clientB = _factory.CreateClient();

        // Register User A
        var regA = await clientA.PostAsJsonAsync("/api/auth/register", new { email = "a@test.com", password = "password" });
        var tokenA = (await regA.Content.ReadFromJsonAsync<TokenResponse>())!.Token;
        clientA.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", tokenA);

        // Register User B
        var regB = await clientB.PostAsJsonAsync("/api/auth/register", new { email = "b@test.com", password = "password" });
        var tokenB = (await regB.Content.ReadFromJsonAsync<TokenResponse>())!.Token;
        clientB.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", tokenB);

        // User A creates job
        var createJob = await clientA.PostAsJsonAsync("/api/jobs", new CreateJobRequest { Name = "Job A", JobType = "noop" });
        var jobA = await createJob.Content.ReadFromJsonAsync<JobResponse>();

        // User B tries to access it
        var getJob = await clientB.GetAsync($"/api/jobs/{jobA!.Id}");
        
        getJob.StatusCode.Should().Be(HttpStatusCode.NotFound); // Or Forbidden, but our endpoint returns NotFound
    }
}

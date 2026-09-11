using System.Net;
using System.Net.Http.Json;
using System.Threading.Tasks;
using FluentAssertions;
using JobAutomation.Api.DTOs.Auth;
using JobAutomation.Api.DTOs.Jobs;
using Xunit;

namespace JobAutomation.Tests;

public class DuplicateExecutionTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly CustomWebApplicationFactory _factory;

    public DuplicateExecutionTests(CustomWebApplicationFactory factory)
    {
        _factory = factory;
    }

    [Fact]
    public async Task TriggerJobTwice_ReturnsSameExecutionId()
    {
        var client = _factory.CreateClient();
        
        // Setup User
        var reg = await client.PostAsJsonAsync("/api/auth/register", new { email = "dup@test.com", password = "password" });
        var token = (await reg.Content.ReadFromJsonAsync<TokenResponse>())!.Token;
        client.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);

        // Create Job
        var jobRes = await client.PostAsJsonAsync("/api/jobs", new CreateJobRequest { Name = "Dup Test", JobType = "noop" });
        var job = await jobRes.Content.ReadFromJsonAsync<JobResponse>();

        // Trigger 1
        var trigger1 = await client.PostAsync($"/api/jobs/{job!.Id}/trigger", null);
        var exec1 = await trigger1.Content.ReadFromJsonAsync<System.Text.Json.JsonElement>();
        var id1 = exec1.GetProperty("executionId").GetGuid();

        // Trigger 2 immediately
        var trigger2 = await client.PostAsync($"/api/jobs/{job!.Id}/trigger", null);
        var exec2 = await trigger2.Content.ReadFromJsonAsync<System.Text.Json.JsonElement>();
        var id2 = exec2.GetProperty("executionId").GetGuid();

        id1.Should().Be(id2);
    }
}

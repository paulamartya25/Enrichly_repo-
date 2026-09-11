using System;
using System.Threading.Tasks;
using JobAutomation.Api.Data;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Testcontainers.PostgreSql;
using Xunit;

namespace JobAutomation.Tests;

public class CustomWebApplicationFactory : WebApplicationFactory<Program>, IAsyncLifetime
{
    private readonly PostgreSqlContainer _dbContainer = new PostgreSqlBuilder()
        .WithImage("postgres:15-alpine")
        .Build();

    public async Task InitializeAsync()
    {
        await _dbContainer.StartAsync();
        
        // Ensure database is created since we don't have migrations yet
        using var scope = Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        await db.Database.EnsureCreatedAsync();
    }

    public new async Task DisposeAsync()
    {
        await _dbContainer.DisposeAsync();
    }

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.ConfigureAppConfiguration((context, config) =>
        {
            config.AddInMemoryCollection(new[]
            {
                new System.Collections.Generic.KeyValuePair<string, string?>("DATABASE_URL", _dbContainer.GetConnectionString()),
                new System.Collections.Generic.KeyValuePair<string, string?>("JWT_SECRET", "super-secret-key-that-is-at-least-32-bytes-long-for-tests"),
                new System.Collections.Generic.KeyValuePair<string, string?>("JWT_ISSUER", "test-issuer"),
                new System.Collections.Generic.KeyValuePair<string, string?>("JWT_AUDIENCE", "test-audience"),
                new System.Collections.Generic.KeyValuePair<string, string?>("WORKER_CONCURRENCY", "1"), // disabled for some tests, can be overridden
                new System.Collections.Generic.KeyValuePair<string, string?>("WORKER_POLL_INTERVAL_MS", "1000")
            });
        });

        builder.ConfigureServices(services =>
        {
            services.RemoveAll(typeof(DbContextOptions<AppDbContext>));
            services.AddDbContextFactory<AppDbContext>(options =>
                options.UseNpgsql(_dbContainer.GetConnectionString()));
            services.AddDbContext<AppDbContext>(options =>
                options.UseNpgsql(_dbContainer.GetConnectionString()));
        });
    }
}

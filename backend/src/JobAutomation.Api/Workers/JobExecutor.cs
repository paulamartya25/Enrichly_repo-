using System;
using System.Diagnostics;
using System.Net.Http;
using System.Text;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using JobAutomation.Api.Models;
using Microsoft.Extensions.Logging;

namespace JobAutomation.Api.Workers;

public class JobExecutor
{
    private readonly ILogger<JobExecutor> _logger;
    private readonly IHttpClientFactory _httpClientFactory;

    public JobExecutor(ILogger<JobExecutor> logger, IHttpClientFactory httpClientFactory)
    {
        _logger = logger;
        _httpClientFactory = httpClientFactory;
    }

    public async Task<(bool success, string? logs, string? errorMessage, long durationMs)> ExecuteAsync(Job job, CancellationToken cancellationToken)
    {
        var sw = Stopwatch.StartNew();
        var logs = new StringBuilder();
        
        try
        {
            logs.AppendLine($"[INFO] Starting execution for job {job.Id} of type {job.JobType}");
            
            if (job.JobType == "noop")
            {
                await Task.Delay(500, cancellationToken);
                logs.AppendLine("[INFO] No-op job completed successfully.");
                return (true, logs.ToString(), null, sw.ElapsedMilliseconds);
            }
            
            if (job.JobType == "http" || job.JobType == "webhook")
            {
                var config = job.Config.RootElement;
                var url = config.TryGetProperty("url", out var urlProp) ? urlProp.GetString() : null;

                // Webhooks default to POST, HTTP jobs default to GET
                var defaultMethod = job.JobType == "webhook" ? "POST" : "GET";
                var methodStr = config.TryGetProperty("method", out var methodProp) ? methodProp.GetString() : defaultMethod;
                var method = new HttpMethod(methodStr ?? defaultMethod);
                
                if (string.IsNullOrEmpty(url))
                    throw new Exception("URL is missing in job configuration.");

                var request = new HttpRequestMessage(method, url);

                if (config.TryGetProperty("headers", out var headersProp) && headersProp.ValueKind == JsonValueKind.Object)
                {
                    foreach (var header in headersProp.EnumerateObject())
                    {
                        request.Headers.TryAddWithoutValidation(header.Name, header.Value.GetString());
                    }
                }

                if (config.TryGetProperty("body", out var bodyProp) && bodyProp.ValueKind != JsonValueKind.Null && bodyProp.ValueKind != JsonValueKind.Undefined)
                {
                    var bodyContent = bodyProp.ValueKind == JsonValueKind.String ? bodyProp.GetString() : bodyProp.GetRawText();
                    request.Content = new StringContent(bodyContent ?? "", Encoding.UTF8, "application/json");
                }

                logs.AppendLine($"[INFO] Sending {method} request to {url}");
                using var client = _httpClientFactory.CreateClient();
                using var response = await client.SendAsync(request, cancellationToken);
                
                logs.AppendLine($"[INFO] Received response status code: {(int)response.StatusCode}");
                var responseContent = await response.Content.ReadAsStringAsync(cancellationToken);
                logs.AppendLine($"[INFO] Response body (truncated to 1000 chars): {Truncate(responseContent, 1000)}");
                
                response.EnsureSuccessStatusCode();
                
                return (true, logs.ToString(), null, sw.ElapsedMilliseconds);
            }
            
            throw new Exception($"Unknown job type: {job.JobType}");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Execution failed for job {JobId}", job.Id);
            logs.AppendLine($"[ERROR] Execution failed: {ex.Message}");
            return (false, logs.ToString(), ex.Message, sw.ElapsedMilliseconds);
        }
    }

    private static string Truncate(string value, int maxChars)
    {
        return value.Length <= maxChars ? value : value.Substring(0, maxChars) + "...";
    }
}

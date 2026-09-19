using System.Buffers;
using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using MessagePack;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Miras.Api.Data;
using Miras.Api.Dtos;
using Miras.Api.Models;
using Miras.Api.Services;
using NetTopologySuite.Geometries;
using Location = Miras.Api.Models.Location;

namespace Miras.Api.Tests;

public class ArBundleTests
{
    // ==========================================
    // 1. MindMerger Unit Tests
    // ==========================================

    [Fact]
    public void MindMerger_MergesMultipleFiles_PreservingRawTargetsAndManifestOrder()
    {
        // Arrange: Create file 1 with 2 targets and file 2 with 1 target
        byte[] targetA = CreateRawTarget("target-alpha", new byte[] { 10, 20, 30 });
        byte[] targetB = CreateRawTarget("target-beta", new byte[] { 40, 50 });
        byte[] targetC = CreateRawTarget("target-gamma", new byte[] { 60, 70, 80, 90 });

        byte[] mindFile1 = CreateMindFile(2, [targetA, targetB]);
        byte[] mindFile2 = CreateMindFile(2, [targetC]);

        var inputs = new List<MindFileInput>
        {
            new("loc-1", "ent-10", mindFile1),
            new("loc-2", "ent-20", mindFile2)
        };

        // Act
        var result = MindMerger.MergeMindFiles(inputs);

        // Assert: Verify Manifest
        Assert.NotNull(result);
        Assert.Equal(3, result.Manifest.Targets.Count);

        Assert.Equal(0, result.Manifest.Targets[0].TargetIndex);
        Assert.Equal("loc-1", result.Manifest.Targets[0].LocationId);
        Assert.Equal("ent-10", result.Manifest.Targets[0].EntityId);

        Assert.Equal(1, result.Manifest.Targets[1].TargetIndex);
        Assert.Equal("loc-1", result.Manifest.Targets[1].LocationId);
        Assert.Equal("ent-10", result.Manifest.Targets[1].EntityId);

        Assert.Equal(2, result.Manifest.Targets[2].TargetIndex);
        Assert.Equal("loc-2", result.Manifest.Targets[2].LocationId);
        Assert.Equal("ent-20", result.Manifest.Targets[2].EntityId);

        // Assert: Read and verify merged .mind structure
        var reader = new MessagePackReader(result.MergedMindBytes);
        int mapCount = reader.ReadMapHeader();
        Assert.Equal(2, mapCount);

        int version = 0;
        var decodedTargets = new List<byte[]>();

        for (int i = 0; i < mapCount; i++)
        {
            string key = reader.ReadString()!;
            if (key == "v")
            {
                version = reader.ReadInt32();
            }
            else if (key == "dataList")
            {
                int count = reader.ReadArrayHeader();
                for (int t = 0; t < count; t++)
                {
                    decodedTargets.Add(reader.ReadRaw().ToArray());
                }
            }
        }

        Assert.Equal(2, version);
        Assert.Equal(3, decodedTargets.Count);
        Assert.Equal(targetA, decodedTargets[0]);
        Assert.Equal(targetB, decodedTargets[1]);
        Assert.Equal(targetC, decodedTargets[2]);
    }

    [Fact]
    public void MindMerger_IncompatibleVersions_ThrowsInvalidOperationException()
    {
        byte[] target = CreateRawTarget("t1", [1]);
        byte[] fileV2 = CreateMindFile(2, [target]);
        byte[] fileV3 = CreateMindFile(3, [target]);

        var inputs = new List<MindFileInput>
        {
            new("loc-1", "ent-1", fileV2),
            new("loc-2", "ent-2", fileV3)
        };

        var ex = Assert.Throws<InvalidOperationException>(() => MindMerger.MergeMindFiles(inputs));
        Assert.Contains("Incompatible .mind version", ex.Message);
    }

    [Fact]
    public void MindMerger_EmptyList_ThrowsArgumentException()
    {
        Assert.Throws<ArgumentException>(() => MindMerger.MergeMindFiles([]));
    }

    // ==========================================
    // 2. ArService Logic & Filtering Tests
    // ==========================================

    [Fact]
    public async Task ArService_ReturnsNull_WhenNoTargetsWithin500m()
    {
        using var db = TestDbHelper.CreateContext();
        var storage = new LocalMindStorage(new Microsoft.Extensions.Configuration.ConfigurationBuilder().Build());
        var service = new ArService(db, storage);

        // Location far away (North Pole)
        var result = await service.GetNearbyBundleAsync(89.0, 0.0);
        Assert.Null(result);
    }

    [Fact]
    public async Task ArService_FiltersBy500mRadius_AndExcludesInactive()
    {
        using var db = TestDbHelper.CreateContext();
        var storage = new LocalMindStorage(new Microsoft.Extensions.Configuration.ConfigurationBuilder().Build());

        // Center coordinates: 55.7984, 49.1052 (Kremlin)
        // Add active point nearby (~150m away)
        db.Locations.Add(new Location
        {
            Id = 100,
            Name = "Тестовая точка рядом",
            EntityId = 1,
            NfcToken = "TEST_NEARBY_1",
            Latitude = 55.7990,
            Longitude = 49.1052,
            Position = new Point(49.1052, 55.7990) { SRID = 4326 },
            IsActive = true
        });

        // Add inactive point nearby (~50m away)
        db.Locations.Add(new Location
        {
            Id = 101,
            Name = "Неактивная точка",
            EntityId = 1,
            NfcToken = "TEST_INACTIVE",
            Latitude = 55.7985,
            Longitude = 49.1052,
            Position = new Point(49.1052, 55.7985) { SRID = 4326 },
            IsActive = false
        });

        // Add active point far away (~1500m away)
        db.Locations.Add(new Location
        {
            Id = 102,
            Name = "Далекая точка",
            EntityId = 2,
            NfcToken = "TEST_FAR",
            Latitude = 55.8150,
            Longitude = 49.1052,
            Position = new Point(49.1052, 55.8150) { SRID = 4326 },
            IsActive = true
        });

        await db.SaveChangesAsync();

        var service = new ArService(db, storage);

        // Act: Search at 55.7984, 49.1052
        var result = await service.GetNearbyBundleAsync(55.7984, 49.1052);

        // Assert
        Assert.NotNull(result);
        Assert.NotEmpty(result.Manifest.Targets);

        // Target 101 (inactive) and 102 (far) must NOT be present
        Assert.DoesNotContain(result.Manifest.Targets, t => t.LocationId == "101");
        Assert.DoesNotContain(result.Manifest.Targets, t => t.LocationId == "102");
        Assert.Contains(result.Manifest.Targets, t => t.LocationId == "100");
    }

    [Fact]
    public async Task ArService_LimitsResultsTo10Points()
    {
        using var db = TestDbHelper.CreateContext();
        var storage = new LocalMindStorage(new Microsoft.Extensions.Configuration.ConfigurationBuilder().Build());

        // Add 15 active points within 300m
        for (int i = 1; i <= 15; i++)
        {
            db.Locations.Add(new Location
            {
                Id = 200 + i,
                Name = $"Точка {i}",
                EntityId = 1,
                NfcToken = $"TEST_LIMIT_{i}",
                Latitude = 55.7984 + (i * 0.0001), // ~11m step
                Longitude = 49.1052,
                Position = new Point(49.1052, 55.7984 + (i * 0.0001)) { SRID = 4326 },
                IsActive = true
            });
        }
        await db.SaveChangesAsync();

        var service = new ArService(db, storage);
        var result = await service.GetNearbyBundleAsync(55.7984, 49.1052);

        Assert.NotNull(result);
        Assert.True(result.Manifest.Targets.Count <= 10);
    }

    // ==========================================
    // 3. HTTP Endpoint Integration Tests
    // ==========================================

    [Theory]
    [InlineData(null, 49.1)]
    [InlineData(55.8, null)]
    [InlineData(95.0, 49.1)] // Latitude > 90
    [InlineData(-95.0, 49.1)] // Latitude < -90
    [InlineData(55.8, 190.0)] // Longitude > 180
    [InlineData(55.8, -190.0)] // Longitude < -180
    public async Task ArBundleEndpoint_InvalidCoordinates_Returns400(double? lat, double? lon)
    {
        using var factory = new CustomWebApplicationFactory();
        var client = factory.CreateClient();

        var response = await client.PostAsJsonAsync("/api/ar/bundle", new ArBundleRequest(lat, lon));
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);

        var err = await response.Content.ReadFromJsonAsync<ArErrorResponse>();
        Assert.NotNull(err);
        Assert.Equal("INVALID_COORDINATES", err.Code);
    }

    [Fact]
    public async Task ArBundleEndpoint_NoNearbyTargets_Returns404()
    {
        using var factory = new CustomWebApplicationFactory();
        var client = factory.CreateClient();

        // Far away coordinates
        var response = await client.PostAsJsonAsync("/api/ar/bundle", new ArBundleRequest(0.0, 0.0));
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);

        var err = await response.Content.ReadFromJsonAsync<ArErrorResponse>();
        Assert.NotNull(err);
        Assert.Equal("NO_AR_TARGETS_NEARBY", err.Code);
    }

    [Fact]
    public async Task ArBundleEndpoint_NearbyTargetsFound_ReturnsMultipartFormData()
    {
        using var factory = new CustomWebApplicationFactory();
        var client = factory.CreateClient();

        // Near Kazan Kremlin (seed location 4 at 55.7984, 49.1052)
        var response = await client.PostAsJsonAsync("/api/ar/bundle", new ArBundleRequest(55.7980, 49.1050));
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        // Verify Content-Type is multipart/form-data
        Assert.NotNull(response.Content.Headers.ContentType);
        Assert.Equal("multipart/form-data", response.Content.Headers.ContentType.MediaType);
        Assert.False(string.IsNullOrEmpty(response.Content.Headers.ContentType.Parameters.FirstOrDefault(p => p.Name == "boundary")?.Value));

        // Read multipart content
        string boundary = response.Content.Headers.ContentType.Parameters.First(p => p.Name == "boundary").Value!.Trim('"');
        var stream = await response.Content.ReadAsStreamAsync();
        var reader = new Microsoft.AspNetCore.WebUtilities.MultipartReader(boundary, stream);

        // Part 1: mind
        var mindSection = await reader.ReadNextSectionAsync();
        Assert.NotNull(mindSection);
        Assert.Contains("mind", mindSection.ContentDisposition);
        Assert.Contains("nearby.mind", mindSection.ContentDisposition);
        Assert.Equal("application/octet-stream", mindSection.ContentType);

        using var mindMs = new MemoryStream();
        await mindSection.Body.CopyToAsync(mindMs);
        byte[] mindBytes = mindMs.ToArray();
        Assert.NotEmpty(mindBytes);

        // Part 2: manifest
        var manifestSection = await reader.ReadNextSectionAsync();
        Assert.NotNull(manifestSection);
        Assert.Contains("manifest", manifestSection.ContentDisposition);
        Assert.Contains("manifest.json", manifestSection.ContentDisposition);
        Assert.StartsWith("application/json", manifestSection.ContentType);

        using var manifestReader = new StreamReader(manifestSection.Body);
        string manifestJson = await manifestReader.ReadToEndAsync();
        var manifest = JsonSerializer.Deserialize<ArBundleManifest>(manifestJson);
        Assert.NotNull(manifest);
        Assert.NotEmpty(manifest.Targets);

        // Check target attributes
        var firstTarget = manifest.Targets[0];
        Assert.Equal(0, firstTarget.TargetIndex);
        Assert.False(string.IsNullOrEmpty(firstTarget.LocationId));
        Assert.False(string.IsNullOrEmpty(firstTarget.EntityId));
    }

    // ==========================================
    // Helpers
    // ==========================================

    private static byte[] CreateMindFile(int version, IEnumerable<byte[]> targets)
    {
        var bufferWriter = new ArrayBufferWriter<byte>();
        var writer = new MessagePackWriter(bufferWriter);

        writer.WriteMapHeader(2);
        writer.WriteString("v"u8);
        writer.WriteInt32(version);

        writer.WriteString("dataList"u8);
        var targetList = targets.ToList();
        writer.WriteArrayHeader(targetList.Count);
        foreach (var t in targetList)
        {
            writer.WriteRaw(t);
        }

        writer.Flush();
        return bufferWriter.WrittenSpan.ToArray();
    }

    private static byte[] CreateRawTarget(string name, byte[] payload)
    {
        var bufferWriter = new ArrayBufferWriter<byte>();
        var writer = new MessagePackWriter(bufferWriter);

        writer.WriteMapHeader(2);
        writer.WriteString("name"u8);
        writer.WriteString(System.Text.Encoding.UTF8.GetBytes(name));
        writer.WriteString("data"u8);
        writer.WriteBinHeader(payload.Length);
        var span = writer.GetSpan(payload.Length);
        payload.CopyTo(span);
        writer.Advance(payload.Length);

        writer.Flush();
        return bufferWriter.WrittenSpan.ToArray();
    }
}

// Custom factory to ensure InMemory test database for WebApplicationFactory tests
public class CustomWebApplicationFactory : WebApplicationFactory<Program>
{
    private readonly string _dbName = Guid.NewGuid().ToString();

    protected override void ConfigureWebHost(Microsoft.AspNetCore.Hosting.IWebHostBuilder builder)
    {
        builder.UseSetting("Environment", "Testing");
        builder.ConfigureServices(services =>
        {
            services.AddDbContext<AppDbContext>(options =>
            {
                options.UseInMemoryDatabase(_dbName);
            });

            // Ensure database is populated with seed data
            var sp = services.BuildServiceProvider();
            using var scope = sp.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            db.Database.EnsureCreated();
        });
    }
}

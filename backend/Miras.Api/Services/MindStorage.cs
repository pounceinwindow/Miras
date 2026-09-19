using System.Buffers;
using MessagePack;

namespace Miras.Api.Services;

public interface IMindStorage
{
    Task<byte[]?> GetMindFileAsync(string relativePath, string entityId, CancellationToken cancellationToken = default);
}

public class LocalMindStorage : IMindStorage
{
    private readonly string _baseDirectory;

    public LocalMindStorage(IConfiguration configuration)
    {
        var configuredPath = configuration["MindStorage:Path"];
        if (!string.IsNullOrWhiteSpace(configuredPath))
        {
            _baseDirectory = Path.GetFullPath(configuredPath);
        }
        else
        {
            // Default storage folder
            _baseDirectory = Path.Combine(Directory.GetCurrentDirectory(), "storage");
        }

        Directory.CreateDirectory(_baseDirectory);
    }

    public async Task<byte[]?> GetMindFileAsync(string relativePath, string entityId, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(relativePath))
        {
            return CreateDefaultMindFile(entityId);
        }

        var fullPath = Path.IsPathRooted(relativePath)
            ? relativePath
            : Path.Combine(_baseDirectory, relativePath);

        if (File.Exists(fullPath))
        {
            return await File.ReadAllBytesAsync(fullPath, cancellationToken);
        }

        // If file doesn't exist yet, generate a valid seed .mind file on the fly and save it
        var defaultBytes = CreateDefaultMindFile(entityId);
        try
        {
            var dir = Path.GetDirectoryName(fullPath);
            if (!string.IsNullOrEmpty(dir))
            {
                Directory.CreateDirectory(dir);
            }
            await File.WriteAllBytesAsync(fullPath, defaultBytes, cancellationToken);
        }
        catch
        {
            // Ignore write failures in read-only environments
        }

        return defaultBytes;
    }

    public static byte[] CreateDefaultMindFile(string entityId)
    {
        var bufferWriter = new ArrayBufferWriter<byte>();
        var writer = new MessagePackWriter(bufferWriter);

        // { "v": 2, "dataList": [ targetObject ] }
        writer.WriteMapHeader(2);

        writer.WriteString("v"u8);
        writer.WriteInt32(2);

        writer.WriteString("dataList"u8);
        writer.WriteArrayHeader(1);

        // Write a dummy MindAR target dictionary: { "targetId": entityId, "data": [...] }
        writer.WriteMapHeader(3);
        writer.WriteString("targetId"u8);
        writer.WriteString(System.Text.Encoding.UTF8.GetBytes(entityId));

        writer.WriteString("matchingData"u8);
        var matchBytes = "matching_placeholder_data"u8;
        writer.WriteBinHeader(matchBytes.Length);
        var matchSpan = writer.GetSpan(matchBytes.Length);
        matchBytes.CopyTo(matchSpan);
        writer.Advance(matchBytes.Length);

        writer.WriteString("trackingData"u8);
        var trackBytes = "tracking_placeholder_data"u8;
        writer.WriteBinHeader(trackBytes.Length);
        var trackSpan = writer.GetSpan(trackBytes.Length);
        trackBytes.CopyTo(trackSpan);
        writer.Advance(trackBytes.Length);

        writer.Flush();
        return bufferWriter.WrittenSpan.ToArray();
    }
}

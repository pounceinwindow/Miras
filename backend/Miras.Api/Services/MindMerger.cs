using System.Buffers;
using MessagePack;
using Miras.Api.Dtos;

namespace Miras.Api.Services;

public record MindFileInput(string LocationId, string EntityId, byte[] Content);

public record MergedMindResult(byte[] MergedMindBytes, ArBundleManifest Manifest);

public static class MindMerger
{
    /// <summary>
    /// Merges multiple MindAR (.mind) binary files into a single bundle.
    /// Each file is expected to be a MessagePack map containing:
    /// { "v": 2, "dataList": [target, ...] }
    /// Targets are preserved verbatim using ReadRaw/WriteRaw.
    /// </summary>
    public static MergedMindResult MergeMindFiles(IReadOnlyList<MindFileInput> files)
    {
        if (files == null || files.Count == 0)
        {
            throw new ArgumentException("No .mind files provided to merge.", nameof(files));
        }

        var allTargets = new List<byte[]>();
        var manifestTargets = new List<ArTargetManifestItem>();
        int? commonVersion = null;

        foreach (var file in files)
        {
            var reader = new MessagePackReader(file.Content);
            if (reader.End)
            {
                throw new InvalidOperationException($"Empty .mind content for location {file.LocationId}.");
            }

            int mapHeader = reader.ReadMapHeader();
            int? fileVersion = null;
            var fileTargets = new List<byte[]>();

            for (int i = 0; i < mapHeader; i++)
            {
                string? key = null;
                if (reader.NextMessagePackType == MessagePackType.String)
                {
                    key = reader.ReadString();
                }
                else
                {
                    reader.Skip();
                    reader.Skip();
                    continue;
                }

                if (key == "v")
                {
                    fileVersion = reader.ReadInt32();
                }
                else if (key == "dataList")
                {
                    int arrayCount = reader.ReadArrayHeader();
                    for (int t = 0; t < arrayCount; t++)
                    {
                        var rawTarget = reader.ReadRaw();
                        fileTargets.Add(rawTarget.ToArray());
                    }
                }
                else
                {
                    reader.Skip();
                }
            }

            if (!fileVersion.HasValue)
            {
                throw new InvalidOperationException($"Missing version 'v' in .mind file for location {file.LocationId}.");
            }

            if (!commonVersion.HasValue)
            {
                commonVersion = fileVersion.Value;
            }
            else if (commonVersion.Value != fileVersion.Value)
            {
                throw new InvalidOperationException(
                    $"Incompatible .mind version: expected v={commonVersion.Value}, found v={fileVersion.Value} for location {file.LocationId}.");
            }

            // Append targets and synchronize manifest
            foreach (var targetBytes in fileTargets)
            {
                int targetIndex = allTargets.Count;
                allTargets.Add(targetBytes);
                manifestTargets.Add(new ArTargetManifestItem(targetIndex, file.LocationId, file.EntityId));
            }
        }

        // Encode the merged .mind file
        var bufferWriter = new ArrayBufferWriter<byte>();
        var writer = new MessagePackWriter(bufferWriter);

        writer.WriteMapHeader(2);
        writer.WriteString("v"u8);
        writer.WriteInt32(commonVersion ?? 2);
        writer.WriteString("dataList"u8);
        writer.WriteArrayHeader(allTargets.Count);

        foreach (var target in allTargets)
        {
            writer.WriteRaw(target);
        }

        writer.Flush();

        var mergedBytes = bufferWriter.WrittenSpan.ToArray();
        var manifest = new ArBundleManifest(manifestTargets);

        return new MergedMindResult(mergedBytes, manifest);
    }
}

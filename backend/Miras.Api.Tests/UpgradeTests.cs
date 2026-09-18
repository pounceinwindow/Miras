using Miras.Api.Models;
using Miras.Api.Services;

namespace Miras.Api.Tests;

public class UpgradeTests
{
    [Theory]
    [InlineData(1, 20)]
    [InlineData(2, 40)]
    [InlineData(3, 80)]
    [InlineData(4, 160)]
    public void CostFormula_MatchesRequirements(int currentLevel, int expectedCost)
    {
        Assert.Equal(expectedCost, UpgradeService.GetUpgradeCost(currentLevel));
    }

    [Fact]
    public async Task Upgrade_IncreasesLevelAndDeductsChakChak()
    {
        using var db = TestDbHelper.CreateContext();
        var service = new UpgradeService(db);

        // Add character to user's collection
        var userEntity = new UserEntity
        {
            UserId = 1,
            EntityId = 1,
            Level = 1,
            ObtainedAt = DateTimeOffset.UtcNow
        };
        db.UserEntities.Add(userEntity);
        await db.SaveChangesAsync();

        var result = await service.UpgradeAsync(userEntity.Id, default);

        Assert.Equal(2, result.NewLevel);
        Assert.Equal(20, result.ChakChakSpent);
        Assert.Equal(80, result.RemainingChakChak); // 100 - 20 = 80
        Assert.True(result.UpdatedStats.Hp > 100);
    }

    [Fact]
    public async Task Upgrade_ThrowsWhenNotEnoughChakChak()
    {
        using var db = TestDbHelper.CreateContext();
        var service = new UpgradeService(db);

        var user = await db.Users.FindAsync(1);
        user!.ChakChak = 10; // Not enough for 20

        var userEntity = new UserEntity
        {
            UserId = 1,
            EntityId = 1,
            Level = 1
        };
        db.UserEntities.Add(userEntity);
        await db.SaveChangesAsync();

        await Assert.ThrowsAsync<InvalidOperationException>(() => service.UpgradeAsync(userEntity.Id, default));
    }

    [Fact]
    public async Task Upgrade_ThrowsWhenAtMaxLevel()
    {
        using var db = TestDbHelper.CreateContext();
        var service = new UpgradeService(db);

        var userEntity = new UserEntity
        {
            UserId = 1,
            EntityId = 1,
            Level = UpgradeService.MaxLevel
        };
        db.UserEntities.Add(userEntity);
        await db.SaveChangesAsync();

        await Assert.ThrowsAsync<InvalidOperationException>(() => service.UpgradeAsync(userEntity.Id, default));
    }
}

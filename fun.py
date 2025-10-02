from discord.ext import commands
import random
import discord

roasts = [
    "You're as bright as a black hole.",
    "I'd call you sharp, but that would be a lie.",
    "You're proof that evolution can go in reverse."
]

class Fun(commands.Cog):
    def __init__(self, bot):
        self.bot = bot

    @commands.command()
    async def roast(self, ctx, member: discord.Member=None):
        member = member or ctx.author
        roast = random.choice(roasts)
        await ctx.send(f"{member.display_name}, {roast}")

def setup(bot):
    bot.add_cog(Fun(bot))

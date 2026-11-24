using System.Security.Claims;
using Microsoft.IdentityModel.JsonWebTokens;

namespace SuSu.Api.Services;

public static class ClaimsPrincipalExtensions
{
    // El id del usuario sale del token firmado, nunca de lo que mande el frontend
    public static int? GetUserId(this ClaimsPrincipal user)
    {
        var sub = user.FindFirst(JwtRegisteredClaimNames.Sub)?.Value;
        return int.TryParse(sub, out var id) ? id : null;
    }
}
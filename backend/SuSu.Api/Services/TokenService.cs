using System.Security.Claims;
using System.Text;
using Microsoft.IdentityModel.JsonWebTokens;
using Microsoft.IdentityModel.Tokens;
using SuSu.Api.Models;

namespace SuSu.Api.Services;

public class TokenService
{
    public const string Issuer = "SuSu.Api";
    public const string Audience = "SuSu.Frontend";
    public static readonly TimeSpan Duracion = TimeSpan.FromHours(8);

    private readonly SymmetricSecurityKey _llave;

    public TokenService(IConfiguration config)
    {
        _llave = CrearLlave(config);
    }

    // La misma llave se usa para firmar (aquí) y para validar (Program.cs)
    public static SymmetricSecurityKey CrearLlave(IConfiguration config)
    {
        var clave = config["Jwt:Key"];
        if (string.IsNullOrWhiteSpace(clave) || clave.Length < 32)
            throw new InvalidOperationException(
                "Falta la clave Jwt:Key en user-secrets (mínimo 32 caracteres).");

        return new SymmetricSecurityKey(Encoding.UTF8.GetBytes(clave));
    }

    public (string Token, DateTime Expira) Crear(Usuario usuario)
    {
        var expira = DateTime.UtcNow.Add(Duracion);

        var descriptor = new SecurityTokenDescriptor
        {
            // Solo datos no sensibles: el token se puede leer, solo no se puede falsificar
            Subject = new ClaimsIdentity(new[]
            {
                new Claim(JwtRegisteredClaimNames.Sub, usuario.IdUsuario.ToString()),
                new Claim(JwtRegisteredClaimNames.Email, usuario.Correo),
                new Claim(JwtRegisteredClaimNames.Name, usuario.Nombre)
            }),
            Expires = expira,
            Issuer = Issuer,
            Audience = Audience,
            SigningCredentials = new SigningCredentials(_llave, SecurityAlgorithms.HmacSha256)
        };

        return (new JsonWebTokenHandler().CreateToken(descriptor), expira);
    }
}
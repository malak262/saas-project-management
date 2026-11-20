using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Dapper;
using MySqlConnector;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;

namespace Teamflow;
public class ApiError(int status,string message) : Exception(message) { public int Status {get;}=status; }
public static class Infrastructure {
 public static WebApplicationBuilder Teamflow(this WebApplicationBuilder b) {
  var secret=Environment.GetEnvironmentVariable("JWT_SECRET")??"";if(Encoding.UTF8.GetByteCount(secret)<32)throw new Exception("JWT_SECRET must be at least 32 bytes");
  b.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme).AddJwtBearer(o=>{
   o.MapInboundClaims=false;o.TokenValidationParameters=new(){ValidateIssuer=true,ValidIssuer="teamflow",ValidateAudience=true,ValidAudience="teamflow",ValidateIssuerSigningKey=true,IssuerSigningKey=new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secret)),ValidAlgorithms=[SecurityAlgorithms.HmacSha256],ValidateLifetime=true,RequireExpirationTime=true,ClockSkew=TimeSpan.FromSeconds(15)};
   o.Events=new(){OnChallenge=async c=>{c.HandleResponse();c.Response.StatusCode=401;await c.Response.WriteAsJsonAsync(new{error=new{status=401,message="Please sign in to continue."}});},OnForbidden=async c=>{c.Response.StatusCode=403;await c.Response.WriteAsJsonAsync(new{error=new{status=403,message="You do not have permission for this action."}});}};
  });b.Services.AddAuthorization();b.Services.AddControllers();return b;
 }
 public static void Teamflow(this WebApplication app) {
  app.Use(async(ctx,next)=>{
   try {
    if(ctx.Request.Path.StartsWithSegments("/internal")){
     var expected=Encoding.UTF8.GetBytes(Environment.GetEnvironmentVariable("SERVICE_SECRET")??"");var actual=Encoding.UTF8.GetBytes(ctx.Request.Headers["X-Service-Key"].ToString());
     if(expected.Length<32||!CryptographicOperations.FixedTimeEquals(expected,actual))throw new ApiError(401,"Service authentication is required.");
    }
    await next();
   }catch(ApiError e){ctx.Response.StatusCode=e.Status;await ctx.Response.WriteAsJsonAsync(new{error=new{status=e.Status,message=e.Message}});}
   catch(BadHttpRequestException){ctx.Response.StatusCode=400;await ctx.Response.WriteAsJsonAsync(new{error=new{status=400,message="Send a valid JSON request."}});}
   catch(MySqlException e) when(e.Number==1062){ctx.Response.StatusCode=409;await ctx.Response.WriteAsJsonAsync(new{error=new{status=409,message="This record already exists."}});}
   catch(Exception e){app.Logger.LogError(e,"Request failed");ctx.Response.StatusCode=500;await ctx.Response.WriteAsJsonAsync(new{error=new{status=500,message="Something went wrong. Please try again."}});}
  });app.UseAuthentication();app.UseAuthorization();app.MapGet("/health",()=>Results.Ok(new{status="ok"}));
  app.MapFallback(()=>Results.Json(new{error=new{status=404,message="This endpoint does not exist."}},statusCode:404));
 }
 public static MySqlConnection Db()=>new(Environment.GetEnvironmentVariable("CONNECTION_STRING")??throw new Exception("CONNECTION_STRING is required"));
 public static long UserId(this ClaimsPrincipal u)=>long.TryParse(u.FindFirstValue("sub"),out var id)&&id>0?id:throw new ApiError(401,"Your session is invalid.");
 public static string Text(string? value,string field,int max,bool required=false){var v=value?.Trim()??"";if(v.Length>max||(required&&v.Length==0))throw new ApiError(422,$"{field} must contain {(required?"1":"0")} to {max} characters.");return v;}
 public static async Task Schema(string sql){await using var db=Db();await db.ExecuteAsync(sql);}
}

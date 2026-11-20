using System.Security.Claims;
using Dapper;
using Teamflow;
using static Teamflow.Infrastructure;
var builder=WebApplication.CreateBuilder(args).Teamflow();
var app=builder.Build();app.Teamflow();
await Schema("CREATE TABLE IF NOT EXISTS users (id BIGINT PRIMARY KEY,email VARCHAR(254) NOT NULL UNIQUE,name VARCHAR(100) NOT NULL,role VARCHAR(20) NOT NULL,avatar_url VARCHAR(2000) NOT NULL DEFAULT '',bio VARCHAR(500) NOT NULL DEFAULT '',job_title VARCHAR(100) NOT NULL DEFAULT '')");
const string fields="id AS Id,email AS Email,name AS Name,role AS Role,avatar_url AS AvatarUrl,bio AS Bio,job_title AS JobTitle";
app.MapGet("/internal/users/{id:long}",async(long id)=>{await using var db=Db();return await db.QuerySingleOrDefaultAsync<UserProfile>($"SELECT {fields} FROM users WHERE id=@Id",new{Id=id})??throw new ApiError(404,"User not found.");});
app.MapPost("/internal/users",async(UserInput input)=>{
 if(input.Id<1||!new System.ComponentModel.DataAnnotations.EmailAddressAttribute().IsValid(input.Email))throw new ApiError(422,"A valid user and email are required.");
 var name=Text(input.Name,"Name",100,true);var email=Text(input.Email,"Email",254,true).ToLowerInvariant();var role=input.Role=="ADMIN"?"ADMIN":"MEMBER";
 await using var db=Db();await db.ExecuteAsync("INSERT INTO users(id,email,name,role) VALUES(@Id,@Email,@Name,@Role) ON DUPLICATE KEY UPDATE email=VALUES(email),role=VALUES(role)",new{input.Id,Email=email,Name=name,Role=role});return await db.QuerySingleAsync<UserProfile>($"SELECT {fields} FROM users WHERE id=@Id",new{input.Id});
});
var api=app.MapGroup("/api/users").RequireAuthorization();
api.MapGet("/me",async(ClaimsPrincipal u)=>{await using var db=Db();return await db.QuerySingleOrDefaultAsync<UserProfile>($"SELECT {fields} FROM users WHERE id=@Id",new{Id=u.UserId()})??throw new ApiError(404,"Profile not found. Sign in again.");});
api.MapPut("/me",async(ClaimsPrincipal u,ProfileInput input)=>{
 var name=Text(input.Name,"Name",100,true);var bio=Text(input.Bio,"Bio",500);var job=Text(input.JobTitle,"Job title",100);var avatar=Text(input.AvatarUrl,"Avatar URL",2000);
 if(avatar!=""&&(!Uri.TryCreate(avatar,UriKind.Absolute,out var url)||url.Scheme!="https"))throw new ApiError(422,"Avatar must be an HTTPS image URL.");
 await using var db=Db();await db.ExecuteAsync("UPDATE users SET name=@Name,bio=@Bio,job_title=@Job,avatar_url=@Avatar WHERE id=@Id",new{Name=name,Bio=bio,Job=job,Avatar=avatar,Id=u.UserId()});return await db.QuerySingleAsync<UserProfile>($"SELECT {fields} FROM users WHERE id=@Id",new{Id=u.UserId()});
});
api.MapGet("",async(string? email,ClaimsPrincipal u)=>{
 await using var db=Db();if(email!=null){var normalized=Text(email,"Email",254,true).ToLowerInvariant();var user=await db.QuerySingleOrDefaultAsync<PublicProfile>("SELECT id AS Id,name AS Name,avatar_url AS AvatarUrl,job_title AS JobTitle FROM users WHERE email=@Email",new{Email=normalized});return Results.Json(user);}
 if(u.FindFirstValue("role")!="ADMIN")throw new ApiError(403,"Only platform admins can list all users.");return Results.Ok(await db.QueryAsync<UserProfile>($"SELECT {fields} FROM users ORDER BY id DESC LIMIT 200"));
});
api.MapGet("/{id:long}",async(long id)=>{await using var db=Db();var profile=await db.QuerySingleOrDefaultAsync<PublicProfile>("SELECT id AS Id,name AS Name,avatar_url AS AvatarUrl,job_title AS JobTitle FROM users WHERE id=@Id",new{Id=id});if(profile==null)throw new ApiError(404,"User not found.");return profile;});
app.Run();
record UserInput(long Id,string Email,string Name,string Role);
record ProfileInput(string Name,string? AvatarUrl,string? Bio,string? JobTitle);
record UserProfile(long Id,string Email,string Name,string Role,string AvatarUrl,string Bio,string JobTitle);
record PublicProfile(long Id,string Name,string AvatarUrl,string JobTitle);

using Microsoft.AspNetCore.Mvc;

namespace NotificationService.Controllers;

[ApiController]
[Route("api/notifications")]
public class NotificationController : ControllerBase
{
    [HttpGet]
    public IActionResult Get()
    {
        return Ok("Notification Service OK");
    }
}
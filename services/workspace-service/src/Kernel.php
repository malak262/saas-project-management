<?php
namespace App;
use Symfony\Bundle\FrameworkBundle\Kernel\MicroKernelTrait;
use Symfony\Component\HttpKernel\Kernel as BaseKernel;
use Symfony\Component\DependencyInjection\Loader\Configurator\ContainerConfigurator;
use Symfony\Component\Routing\Loader\Configurator\RoutingConfigurator;
class Kernel extends BaseKernel
{
    use MicroKernelTrait;
    protected function configureContainer(
        ContainerConfigurator $container,
    ): void {
        $container->extension("framework", [
            "secret" => getenv("APP_SECRET") ?: getenv("JWT_SECRET"),
            "router" => ["utf8" => true],
            "http_method_override" => false,
            "handle_all_throwables" => true,
        ]);
        $services = $container->services();
        $services->defaults()->autowire()->autoconfigure();
        $services
            ->load("App\\Controller\\", __DIR__ . "/Controller/")
            ->tag("controller.service_arguments");
    }
    protected function configureRoutes(RoutingConfigurator $routes): void
    {
        $routes->import(__DIR__ . "/Controller/", "attribute");
    }
}

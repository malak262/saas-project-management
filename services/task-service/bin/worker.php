<?php
require __DIR__.'/../vendor/autoload.php';
$api=new \Teamflow\Api(\Symfony\Component\HttpFoundation\Request::create('/worker'));
while(true){try{$api->flush();}catch(\Throwable $e){error_log($e->getMessage());}sleep(5);}

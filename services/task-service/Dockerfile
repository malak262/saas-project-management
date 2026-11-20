FROM php:8.4-fpm
RUN apt-get update && apt-get install -y git unzip libcurl4-openssl-dev nginx supervisor && docker-php-ext-install pdo_mysql curl && rm -rf /var/lib/apt/lists/*
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer
WORKDIR /app
COPY php-common php-common
COPY task-service task-service
WORKDIR /app/task-service
ENV APP_ENV=prod APP_DEBUG=0
RUN cp /usr/local/etc/php/php.ini-production /usr/local/etc/php/php.ini
RUN composer install --no-dev --no-interaction --prefer-dist --no-scripts --optimize-autoloader
COPY php-common/nginx.conf /etc/nginx/sites-enabled/default
COPY php-common/supervisor.conf /etc/supervisor/conf.d/teamflow.conf
RUN sed -i 's|SERVICE|task-service|g' /etc/nginx/sites-enabled/default
RUN mkdir -p var/cache var/log && chown -R www-data:www-data var
EXPOSE 8000
CMD ["sh", "-c", "php bin/init.php && supervisord -c /etc/supervisor/conf.d/teamflow.conf"]

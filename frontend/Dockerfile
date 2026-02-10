FROM nginx:alpine

# Remove default nginx config
RUN rm /etc/nginx/conf.d/default.conf

# Copy custom nginx config
COPY nginx.conf /etc/nginx/conf.d/

# Copy all frontend files
COPY *.html /usr/share/nginx/html/
COPY *.css /usr/share/nginx/html/
COPY *.js /usr/share/nginx/html/

# Copy favicon and images if they exist
COPY favicon.png /usr/share/nginx/html/ 
COPY ./images /usr/share/nginx/html/images

# Expose port 80
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
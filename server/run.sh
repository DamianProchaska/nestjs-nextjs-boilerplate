docker build -t nest-prisma-server .
docker run -d -t -p 8080:8080 nest-prisma-server
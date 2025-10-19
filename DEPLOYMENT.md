# Guia de Deployment - Video Editor App

Este guia explica como fazer deploy da aplicação em um servidor usando Docker.

## Pré-requisitos

- Docker instalado ([Instalar Docker](https://docs.docker.com/get-docker/))
- Docker Compose instalado ([Instalar Docker Compose](https://docs.docker.com/compose/install/))
- Git instalado
- Acesso a um servidor ou máquina com Linux

## Instalação Rápida (Recomendado)

### 1. Clone o repositório

```bash
git clone https://github.com/joaovitor1-mg/teste-video.git
cd teste-video
```

### 2. Execute o script de setup

```bash
chmod +x setup.sh
./setup.sh
```

O script irá:
- Verificar se Docker e Docker Compose estão instalados
- Criar arquivo `.env` com configurações padrão
- Criar diretórios necessários
- Gerar JWT_SECRET seguro
- Construir imagens Docker
- Iniciar os serviços
- Executar migrações do banco de dados

### 3. Acesse a aplicação

Abra seu navegador e acesse: `http://localhost:3000`

---

## Instalação Manual

Se preferir fazer manualmente:

### 1. Clone e entre no diretório

```bash
git clone https://github.com/joaovitor1-mg/teste-video.git
cd teste-video
```

### 2. Configure as variáveis de ambiente

```bash
cp .env.example .env
# Edite o arquivo .env com suas configurações
nano .env
```

### 3. Inicie os serviços

```bash
docker-compose up -d
```

### 4. Execute as migrações

```bash
docker-compose exec app pnpm db:push
```

### 5. Verifique se está rodando

```bash
docker-compose ps
```

---

## Configuração de Variáveis de Ambiente

Edite o arquivo `.env` com suas configurações:

```env
# Database
DATABASE_URL=mysql://video_user:video_pass123@db:3306/video_editor
DB_PASSWORD=video_pass123

# JWT & Auth
JWT_SECRET=seu-secret-muito-seguro-aqui
OAUTH_SERVER_URL=https://api.manus.im
VITE_OAUTH_PORTAL_URL=https://auth.manus.im

# App Configuration
VITE_APP_ID=seu-app-id
VITE_APP_TITLE=Editor de Vídeos Automático
VITE_APP_LOGO=https://seu-logo.com/logo.png

# Owner
OWNER_NAME=Admin
OWNER_OPEN_ID=seu-owner-id

# Manus API
BUILT_IN_FORGE_API_URL=https://api.manus.im
BUILT_IN_FORGE_API_KEY=sua-api-key

# Port
APP_PORT=3000
```

---

## Usando com Nginx (Proxy Reverso)

Para usar Nginx como proxy reverso com SSL:

### 1. Inicie com Nginx

```bash
docker-compose --profile nginx up -d
```

### 2. Configure SSL

Coloque seus certificados SSL em `./certs/`:
- `cert.pem` - Certificado
- `key.pem` - Chave privada

Ou gere certificados auto-assinados:

```bash
mkdir -p certs
openssl req -x509 -newkey rsa:4096 -keyout certs/key.pem -out certs/cert.pem -days 365 -nodes
```

### 3. Reinicie os serviços

```bash
docker-compose --profile nginx restart
```

Acesse: `https://localhost`

---

## Comandos Úteis

### Ver logs

```bash
# Todos os serviços
docker-compose logs -f

# Apenas da aplicação
docker-compose logs -f app

# Apenas do banco de dados
docker-compose logs -f db
```

### Parar serviços

```bash
docker-compose down
```

### Reiniciar serviços

```bash
docker-compose restart
```

### Executar comando no container

```bash
docker-compose exec app bash
docker-compose exec db mysql -u root -p
```

### Ver status

```bash
docker-compose ps
```

---

## Troubleshooting

### Erro: "Docker daemon is not running"

```bash
# No Linux
sudo systemctl start docker

# No macOS
open /Applications/Docker.app

# No Windows
Abra Docker Desktop
```

### Erro: "Port 3000 is already in use"

```bash
# Mude a porta no .env
APP_PORT=3001

# Ou libere a porta
sudo lsof -ti:3000 | xargs kill -9
```

### Erro: "Database connection failed"

```bash
# Verifique se o banco está rodando
docker-compose logs db

# Reinicie o banco
docker-compose restart db
```

### Erro: "Permission denied" ao executar setup.sh

```bash
chmod +x setup.sh
./setup.sh
```

---

## Backup e Restore

### Backup do banco de dados

```bash
docker-compose exec db mysqldump -u root -p video_editor > backup.sql
```

### Restore do banco de dados

```bash
docker-compose exec -T db mysql -u root -p video_editor < backup.sql
```

### Backup de uploads

```bash
tar -czf uploads_backup.tar.gz uploads/
```

---

## Performance e Escalabilidade

### Aumentar limites de memória

Edite `docker-compose.yml`:

```yaml
services:
  app:
    deploy:
      resources:
        limits:
          memory: 4G
        reservations:
          memory: 2G
```

### Aumentar workers do Nginx

Edite `nginx.conf`:

```nginx
worker_processes 4;  # Aumentar conforme número de CPUs
worker_connections 2048;
```

---

## Monitoramento

### Verificar uso de recursos

```bash
docker stats
```

### Health check

```bash
curl http://localhost:3000/health
```

---

## Segurança

1. **Altere todas as senhas padrão** no arquivo `.env`
2. **Gere um JWT_SECRET forte**:
   ```bash
   openssl rand -base64 32
   ```
3. **Use HTTPS em produção** (configure SSL/TLS)
4. **Restrinja acesso ao banco de dados** (não exponha porta 3306)
5. **Mantenha imagens Docker atualizadas**:
   ```bash
   docker-compose pull
   docker-compose up -d
   ```

---

## Próximos Passos

1. Configure seu domínio e SSL
2. Configure backups automáticos
3. Configure monitoramento e alertas
4. Configure CI/CD para atualizações automáticas
5. Configure logs centralizados

---

## Suporte

Para problemas ou dúvidas:
- Verifique os logs: `docker-compose logs -f`
- Abra uma issue no GitHub
- Consulte a documentação do Docker



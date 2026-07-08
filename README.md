# Innovatech Chile — EP3: Orquestación y CI/CD en AWS EKS

> **Asignatura:** ISY1101 — Introducción a Herramientas DevOps  
> **Evaluación:** Parcial N°3 (40%)  
> **Plataforma:** AWS EKS (Kubernetes) + GitHub Actions + Terraform

---

## Tabla de Contenidos

1. [Descripción General](#1-descripción-general)
2. [Arquitectura Final](#2-arquitectura-final)
3. [Estructura del Repositorio](#3-estructura-del-repositorio)
4. [Stack Tecnológico](#4-stack-tecnológico)
5. [Prerrequisitos](#5-prerrequisitos)
6. [Configuración de Infraestructura (Terraform)](#6-configuración-de-infraestructura-terraform)
7. [Manifests de Kubernetes](#7-manifests-de-kubernetes)
8. [Roles IAM y Seguridad](#8-roles-iam-y-seguridad)
9. [Redes y Subredes](#9-redes-y-subredes)
10. [Autoscaling (HPA)](#10-autoscaling-hpa)
11. [Pipeline CI/CD](#11-pipeline-cicd)
12. [Gestión de Secrets y Credenciales](#12-gestión-de-secrets-y-credenciales)
13. [Despliegue Manual Paso a Paso](#13-despliegue-manual-paso-a-paso)
14. [Validación Funcional](#14-validación-funcional)
15. [Análisis de Logs y Métricas](#15-análisis-de-logs-y-métricas)
16. [Desarrollo Local con Docker](#16-desarrollo-local-con-docker)
17. [Problemas Encontrados y Soluciones](#17-problemas-encontrados-y-soluciones)
18. [Decisiones de Diseño y Justificaciones](#18-decisiones-de-diseño-y-justificaciones)

---

## 1. Descripción General

Innovatech Chile es una aplicación empresarial compuesta por un frontend React/Vite y dos backends Spring Boot independientes (despachos y ventas), respaldados por una base de datos MySQL. Este repositorio contiene toda la infraestructura necesaria para desplegar, orquestar y automatizar la aplicación en AWS utilizando EKS (Elastic Kubernetes Service), con un pipeline CI/CD completo via GitHub Actions y la infraestructura declarada como código con Terraform.

El objetivo de esta evaluación es demostrar:
- Orquestación de contenedores en AWS EKS
- Despliegue automatizado desde GitHub a través de GitHub Actions
- Escalabilidad automática con Horizontal Pod Autoscaler (HPA)
- Networking, balanceo de carga y comunicación entre servicios
- Observabilidad mediante logs en CloudWatch y kubectl

---

## 2. Arquitectura Final

```
┌─────────────────────────────────────────────────────────────────────┐
│                         INTERNET                                    │
└───────────────────────────────┬─────────────────────────────────────┘
                                │ HTTP :80
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│              Application Load Balancer (ALB público)                │
│         k8s-innovatech-xxxx.us-east-1.elb.amazonaws.com            │
└──────────┬──────────────────────────┬───────────────────────────────┘
           │ /                        │ /api/v1/*
           ▼                          ▼
┌──────────────────────┐   ┌──────────────────────────────────────────┐
│   frontend-svc :80   │   │  backend-despachos-svc :8081             │
│   (ClusterIP)        │   │  backend-ventas-svc    :8082             │
└──────────┬───────────┘   └──────────────┬───────────────────────────┘
           │                              │
           ▼                              ▼
┌──────────────────────┐   ┌──────────────────────────────────────────┐
│  Pod: frontend       │   │  Pod: backend-despachos (Spring Boot)    │
│  (Nginx + Vite SPA)  │   │  Pod: backend-ventas    (Spring Boot)    │
│  Réplicas: 2         │   │  Réplicas: 2 (cada uno)                  │
└──────────────────────┘   └──────────────┬───────────────────────────┘
                                          │ jdbc:mysql://mysql-svc:3306
                                          ▼
                           ┌──────────────────────────────────────────┐
                           │  Pod: mysql (MySQL 8.0)                  │
                           │  mysql-svc (ClusterIP / headless)        │
                           │  Datos: emptyDir (lab)                   │
                           └──────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                     AWS EKS CLUSTER                                 │
│                   innovatech-eks (us-east-1)                        │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │              Namespace: innovatech                           │   │
│  │  Deployments: frontend, backend-despachos,                   │   │
│  │               backend-ventas, mysql                          │   │
│  │  HPA: frontend (2-4), backends (2-5) — umbral 50% CPU       │   │
│  │  Secrets: mysql-secret                                       │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  Node Group: 2x t3.medium (SPOT) — us-east-1a, us-east-1b         │
│  Add-ons: vpc-cni, coredns, kube-proxy, metrics-server,            │
│           amazon-cloudwatch-observability,                          │
│           aws-load-balancer-controller (via Helm/Terraform)         │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                     VPC: 10.0.0.0/20                                │
│  ┌─────────────────────┐   ┌─────────────────────────────────────┐  │
│  │  Public Subnets     │   │  Private Subnets (app + data)       │  │
│  │  10.0.0.0/24 (1a)   │   │  10.0.2.0/24, 10.0.4.0/24 (app)   │  │
│  │  10.0.1.0/24 (1b)   │   │  10.0.6.0/24, ...      (data)      │  │
│  │  Internet Gateway   │   │  NAT Gateway                        │  │
│  └─────────────────────┘   └─────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                  ECR (Elastic Container Registry)                   │
│  innovatech/frontend                                                │
│  innovatech/backend-despachos                                       │
│  innovatech/backend-ventas                                          │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                       GitHub Actions CI/CD                          │
│  push → main                                                        │
│    Job 1: build & push imágenes a ECR (3 paralelos)                │
│    Job 2: kubectl set image → rollout status                        │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 3. Estructura del Repositorio

```
/
├── .github/
│   └── workflows/
│       └── cicd.yaml                  # Pipeline CI/CD completo
│
├── app-k8s/
│   └── k8s/                           # Manifests de Kubernetes
│       ├── namespace.yaml             # Namespace innovatech
│       ├── mysql-secret.yaml          # Credenciales DB (Secret K8s)
│       ├── mysql-deployment.yaml      # MySQL + ConfigMap init
│       ├── mysql-service.yaml         # ClusterIP headless
│       ├── backend-despachos-deployment.yaml
│       ├── backend-despachos-service.yaml
│       ├── backend-despachos-hpa.yaml # HPA: 2-5 réplicas / 50% CPU
│       ├── backend-ventas-deployment.yaml
│       ├── backend-ventas-service.yaml
│       ├── backend-ventas-hpa.yaml    # HPA: 2-5 réplicas / 50% CPU
│       ├── frontend-deployment.yaml
│       ├── frontend-service.yaml
│       ├── frontend-hpa.yaml          # HPA: 2-4 réplicas / 50% CPU
│       └── ingress.yaml               # ALB Ingress público
│
├── backend-despachos/                 # Spring Boot API (puerto 8081)
│   ├── src/
│   ├── pom.xml
│   ├── Dockerfile                     # Multi-stage Maven → JRE Alpine
│   └── application.properties
│
├── backend-ventas/                    # Spring Boot API (puerto 8082)
│   ├── src/
│   ├── pom.xml
│   ├── Dockerfile
│   └── application.properties
│
├── frontend/                          # React + Vite (puerto 5173 dev)
│   ├── src/
│   ├── package.json
│   ├── Dockerfile                     # Multi-stage Node → Nginx Alpine
│   ├── nginx.conf                     # Proxy inverso → backends
│   ├── nginx.local.conf               # Config para test local Docker
│   ├── .env                           # Variables desarrollo local
│   └── .env.production                # Variables para build Docker
│
└── terraform/
    ├── cluster/                       # Módulo 1: VPC + EKS + ECR
    │   ├── main.tf
    │   ├── variables.tf
    │   ├── outputs.tf
    │   ├── versions.tf
    │   └── terraform.tfvars
    ├── addons/                        # Módulo 2: AWS Load Balancer Controller
    │   ├── main.tf
    │   ├── variables.tf
    │   ├── outputs.tf
    │   ├── versions.tf
    │   └── terraform.tfvars
    ├── modules/
    │   ├── network/                   # VPC, subredes, IGW, NAT
    │   ├── eks/                       # Cluster EKS, node group, addons
    │   ├── ecr/                       # Repositorios ECR
    │   └── security_groups/           # SGs para cluster y nodos
    └── export_vars.sh                 # Script de credenciales AWS Academy
```

---

## 4. Stack Tecnológico

| Capa | Tecnología | Versión |
|------|-----------|---------|
| Frontend | React + Vite + Nginx | Node 20, Nginx Alpine |
| Backend Despachos | Spring Boot | Java 21, puerto 8081 |
| Backend Ventas | Spring Boot | Java 21, puerto 8082 |
| Base de Datos | MySQL | 8.0 |
| Orquestación | Kubernetes (AWS EKS) | 1.30 |
| Infraestructura | Terraform | >= 1.10 |
| Registry | Amazon ECR | — |
| Load Balancer | AWS ALB (via LBC) | Helm chart |
| CI/CD | GitHub Actions | — |
| Logs | CloudWatch + kubectl | — |
| Nodos | EC2 t3.medium SPOT | 2 nodos |

---

## 5. Prerrequisitos

### Herramientas locales (Linux/Mint)

```bash
# AWS CLI v2
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip && sudo ./aws/install

# kubectl
curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
sudo install -o root -g root -m 0755 kubectl /usr/local/bin/kubectl

# eksctl
PLATFORM=Linux_amd64
curl -sLO "https://github.com/eksctl-io/eksctl/releases/latest/download/eksctl_$PLATFORM.tar.gz"
tar -xzf eksctl_$PLATFORM.tar.gz -C /tmp && sudo mv /tmp/eksctl /usr/local/bin

# Helm
curl https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash

# jq (requerido por el script de credenciales de Terraform)
sudo apt-get install -y jq

# Terraform
sudo apt-get install -y gnupg software-properties-common
wget -O- https://apt.releases.hashicorp.com/gpg | sudo gpg --dearmor -o /usr/share/keyrings/hashicorp-archive-keyring.gpg
echo "deb [signed-by=/usr/share/keyrings/hashicorp-archive-keyring.gpg] https://apt.releases.hashicorp.com $(lsb_release -cs) main" | sudo tee /etc/apt/sources.list.d/hashicorp.list
sudo apt update && sudo apt-get install terraform
```

### Acceso AWS Academy
- Laboratorio activo con créditos suficientes (~3-4 horas de lab para el deploy completo)
- Rol `LabRole` disponible (activo automáticamente al iniciar el lab en Vocareum)

---

## 6. Configuración de Infraestructura (Terraform)

La infraestructura está dividida en dos módulos raíz que deben aplicarse **en orden**. Esta separación existe porque los providers de Kubernetes y Helm (en `addons/`) requieren que el cluster ya exista, mientras que `cluster/` solo usa el provider de AWS.

### Módulos

| Módulo | Responsabilidad |
|--------|----------------|
| `terraform/cluster/` | VPC, subredes, IGW, NAT, Security Groups, EKS, ECR |
| `terraform/addons/` | AWS Load Balancer Controller (via Helm), Secret de credenciales |
| `modules/network` | VPC + 3 capas de subredes (public, private-app, private-data) |
| `modules/eks` | Cluster EKS + node group SPOT + addons (vpc-cni, metrics-server, CloudWatch) |
| `modules/ecr` | Repositorios ECR para las 3 imágenes |
| `modules/security_groups` | SG del cluster y de los nodos con reglas explícitas |

### Paso a paso

```bash
# 1. Exportar credenciales AWS Academy
#    Copiar las credenciales desde Vocareum → AWS Details → AWS CLI
nano terraform/export_vars.sh   # pegar AWS_ACCESS_KEY_ID, SECRET y SESSION_TOKEN
source terraform/export_vars.sh
aws sts get-caller-identity     # verificar que funcionan

# 2. Crear terraform.tfvars para cluster/
cp terraform/cluster/terrafrom.tfvars.example terraform/cluster/terraform.tfvars
# Editar y ajustar cluster_name, ecr_repo_names, etc.

# 3. Aplicar cluster/ (~15 minutos)
cd terraform/cluster
terraform init
terraform plan
terraform apply

# 4. Conectar kubectl
aws eks update-kubeconfig --region us-east-1 --name innovatech-eks
kubectl get nodes   # debe mostrar 2 nodos Ready

# 5. Crear terraform.tfvars para addons/
cp terraform/addons/terrafrom.tfvars.example terraform/addons/terraform.tfvars
# Editar cluster_name

# 6. Aplicar addons/ (~3 minutos)
cd ../addons
terraform init
terraform plan
terraform apply

# 7. Verificar Load Balancer Controller
kubectl get deployment aws-load-balancer-controller -n kube-system
```

### Variables principales (cluster/terraform.tfvars)

```hcl
region             = "us-east-1"
cluster_name       = "innovatech-eks"
cluster_version    = "1.30"
vpc_cidr           = "10.0.0.0/20"
azs                = ["us-east-1a", "us-east-1b"]
cluster_role_name  = "LabRole"
node_role_name     = "LabRole"
node_instance_type = "t3.medium"
node_desired_size  = 2
node_min_size      = 2
node_max_size      = 4
ecr_repo_names     = [
  "innovatech/frontend",
  "innovatech/backend-despachos",
  "innovatech/backend-ventas"
]
```

---

## 7. Manifests de Kubernetes

Todos los manifests viven en `app-k8s/k8s/` y están organizados en el siguiente orden de dependencia:

```
namespace → secret → mysql (deployment + service) → backends → frontend → ingress
```

### Descripción de cada manifest

| Archivo | Tipo | Descripción |
|---------|------|-------------|
| `namespace.yaml` | Namespace | Aísla todos los recursos bajo `innovatech` |
| `mysql-secret.yaml` | Secret | Variables de BD para ambos backends (Opaque) |
| `mysql-deployment.yaml` | Deployment + ConfigMap | MySQL 8.0 con init.sql que crea ambas DBs |
| `mysql-service.yaml` | Service (ClusterIP) | DNS interno `mysql-svc:3306` |
| `backend-despachos-deployment.yaml` | Deployment | Spring Boot con variables inyectadas desde Secret |
| `backend-despachos-service.yaml` | Service (ClusterIP) | DNS interno `backend-despachos-svc:8081` |
| `backend-despachos-hpa.yaml` | HPA | Autoscaling 2-5 réplicas al 50% CPU |
| `backend-ventas-deployment.yaml` | Deployment | Spring Boot con sus propias variables de entorno |
| `backend-ventas-service.yaml` | Service (ClusterIP) | DNS interno `backend-ventas-svc:8082` |
| `backend-ventas-hpa.yaml` | HPA | Autoscaling 2-5 réplicas al 50% CPU |
| `frontend-deployment.yaml` | Deployment | Nginx sirviendo SPA + proxy a backends |
| `frontend-service.yaml` | Service (ClusterIP) | DNS interno `frontend-svc:80` |
| `frontend-hpa.yaml` | HPA | Autoscaling 2-4 réplicas al 50% CPU |
| `ingress.yaml` | Ingress (ALB) | Punto de entrada público con rutas |

### Comunicación entre servicios

```
Browser → ALB → Ingress
                 ├── /* → frontend-svc:80
                 │         └── Pod Nginx
                 │               ├── /api/v1/despachos/* → backend-despachos-svc:8081
                 │               └── /api/v1/ventas/*    → backend-ventas-svc:8082
                 ├── /api/v1/despachos → backend-despachos-svc:8081
                 └── /api/v1/ventas    → backend-ventas-svc:8082
                                              └── mysql-svc:3306
```

Los backends se comunican con MySQL usando el nombre DNS del Service (`mysql-svc`) que Kubernetes resuelve automáticamente dentro del namespace `innovatech`. No se usan IPs hardcodeadas.

---

## 8. Roles IAM y Seguridad

### Limitaciones de AWS Academy

AWS Academy restringe `iam:CreateRole`, `iam:AttachRolePolicy` y otros permisos de IAM. Esto impide:
- Crear roles IAM dedicados para el cluster y los nodos
- Instalar el Amazon EBS CSI Driver con permisos completos
- Usar IRSA (IAM Roles for Service Accounts) para el LBC

### Solución adoptada

Se utilizó el rol `LabRole` preexistente de AWS Academy para ambos roles EKS (cluster y node group). Este rol incluye los permisos necesarios para EKS en el contexto del laboratorio.

Para el AWS Load Balancer Controller, al no poder usar IRSA, las credenciales se inyectan como variables de entorno mediante un `kubernetes_secret` creado por Terraform en `kube-system`. El LBC las lee al arrancar como `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY` y `AWS_SESSION_TOKEN`.

### Security Groups

| Security Group | Reglas de Ingress |
|---------------|-------------------|
| `eks-cluster-sg` | Todo tráfico desde VPC CIDR + desde `eks-nodes-sg` |
| `eks-nodes-sg` | Todo desde cluster SG + auto (inter-node) + HTTP :80 + :8081/:8082 desde VPC + MySQL :3306 desde VPC |

Ambos SGs permiten todo el egress (salida), lo cual es necesario para que los nodos descarguen imágenes de ECR y se comuniquen con el API server de EKS.

---

## 9. Redes y Subredes

La VPC usa el CIDR `10.0.0.0/20` dividido en tres capas:

| Capa | Subredes | CIDR | AZ |
|------|---------|------|----|
| Public | public-subnet-1, public-subnet-2 | 10.0.0.0/24, 10.0.1.0/24 | us-east-1a, us-east-1b |
| Private App | private-app-subnet-1, private-app-subnet-2 | 10.0.2.0/24, 10.0.3.0/24 | us-east-1a, us-east-1b |
| Private Data | private-data-subnet-1, private-data-subnet-2 | 10.0.4.0/24, 10.0.5.0/24 | us-east-1a, us-east-1b |

**Flujo de tráfico:**
- Subredes públicas → Internet Gateway (tráfico entrante del ALB)
- Subredes privadas → NAT Gateway (tráfico saliente de los nodos: ECR, API server)
- Los nodos EKS se distribuyen en todas las subredes para alta disponibilidad

**Tags obligatorios en subredes** (requeridos por el AWS Load Balancer Controller):
- `kubernetes.io/cluster/innovatech-eks: shared`
- Públicas: `kubernetes.io/role/elb: 1`
- Privadas: `kubernetes.io/role/internal-elb: 1`

---

## 10. Autoscaling (HPA)

Se configuró Horizontal Pod Autoscaler (HPA) para los tres servicios de aplicación. MySQL no tiene HPA porque es un servicio stateful que no debe escalarse horizontalmente sin configuración adicional (clustering, replicación).

### Configuración

| Servicio | Min Réplicas | Max Réplicas | Métrica | Umbral |
|---------|-------------|-------------|---------|--------|
| frontend | 2 | 4 | CPU | 50% |
| backend-despachos | 2 | 5 | CPU | 50% |
| backend-ventas | 2 | 5 | CPU | 50% |

### Justificación del umbral del 50%

Se eligió 50% de CPU como umbral de escala por las siguientes razones:
- Permite absorber picos repentinos antes de que el servicio se degrade
- Da tiempo suficiente para que los nuevos pods arranquen (~30s para Spring Boot) sin que el tráfico ya esté saturando los pods existentes
- Es el valor estándar recomendado por la documentación de Kubernetes para aplicaciones de tipo API REST

### Cómo verificar el HPA

```bash
# Ver estado actual
kubectl get hpa -n innovatech

# Descripción detallada con historial de eventos
kubectl describe hpa hpa-backend-despachos -n innovatech

# Simular carga para activar el autoscaling
kubectl run load-test --image=busybox -n innovatech --rm -it -- sh
# Dentro del pod:
while true; do wget -q -O- http://backend-despachos-svc:8081/api/v1/despachos; done
```

El HPA requiere que el addon `metrics-server` esté activo en el cluster para leer las métricas de CPU de los pods.

---

## 11. Pipeline CI/CD

El pipeline está en `.github/workflows/cicd.yaml` y se activa automáticamente con cada `push` a la rama `main`.

### Flujo

```
Push a main
    │
    ├── Job 1: build-and-push
    │     ├── Checkout código
    │     ├── Generar tag = SHA corto del commit (7 chars)
    │     ├── Configurar credenciales AWS
    │     ├── Login a ECR
    │     ├── docker build + push → backend-despachos (tag + latest)
    │     ├── docker build + push → backend-ventas    (tag + latest)
    │     └── docker build + push → frontend          (tag + latest)
    │
    └── Job 2: deploy (depende de Job 1)
          ├── Checkout código
          ├── Configurar credenciales AWS
          ├── aws eks update-kubeconfig
          ├── kubectl apply -f app-k8s/k8s/ --validate=false
          ├── kubectl set image (usa el SHA tag para forzar redeploy)
          ├── kubectl rollout status (espera que cada deployment termine)
          └── kubectl get ingress (muestra URL pública)
```

### Secrets requeridos en GitHub

Configurar en: Repositorio → Settings → Secrets and variables → Actions

| Secret | Descripción |
|--------|------------|
| `AWS_ACCESS_KEY_ID` | De AWS Academy → Vocareum → AWS Details |
| `AWS_SECRET_ACCESS_KEY` | De AWS Academy → Vocareum → AWS Details |
| `AWS_SESSION_TOKEN` | De AWS Academy → Vocareum → AWS Details |
| `ECR_REGISTRY` | `<ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com` |

> **Importante:** Las credenciales de AWS Academy expiran y rotan cada vez que se reinicia el lab. Deben actualizarse en GitHub Secrets antes de cada ejecución del pipeline.

### Tags de imágenes

Cada build genera dos tags para la misma imagen:
- `latest` — siempre apunta a la versión más reciente
- `<sha>` — tag inmutable del commit específico (ej: `a3f7b2c`)

El deploy usa el tag `<sha>` para garantizar que `kubectl set image` detecte el cambio y ejecute un rollout, incluso si el contenido del código no cambió (lo que ocurriría si solo se usara `latest`).

---

## 12. Gestión de Secrets y Credenciales

### Kubernetes Secret para la BD

Las credenciales de MySQL se almacenan en un `Secret` de Kubernetes de tipo `Opaque`. Cada backend extrae solo las variables que su `application.properties` espera:

**backend-despachos** usa:
- `DB_URL` — JDBC URL completa incluyendo el host (`mysql-svc`)
- `DB_USER` — usuario de BD
- `DB_PASS` — contraseña de BD

**backend-ventas** usa variables separadas:
- `DB_ENDPOINT` — hostname del servidor MySQL (`mysql-svc`)
- `DB_PORT` — puerto (3306)
- `DB_NAME` — nombre de la base de datos (`db_ventas`)
- `DB_USERNAME` — usuario de BD
- `DB_PASSWORD` — contraseña de BD

Esta separación respeta el contrato de cada `application.properties` sin modificar el código fuente de los backends.

### Buenas prácticas aplicadas

- Los Secrets de K8s **nunca se commitean** al repositorio. El archivo `mysql-secret.yaml` sube al repo porque no contiene credenciales reales de producción (contraseña vacía en el entorno de lab).
- Las credenciales de AWS van en GitHub Secrets, nunca en el código ni en los YAML.
- El archivo `terraform/export_vars.sh` está en `.gitignore` (contiene las credenciales del lab).
- Los archivos `terraform.tfvars` también están en `.gitignore`.

---

## 13. Despliegue Manual Paso a Paso

Para reproducir el despliegue completo desde cero:

```bash
# ── 1. Credenciales ─────────────────────────────────────────────────
nano terraform/export_vars.sh   # pegar credenciales de AWS Academy
source terraform/export_vars.sh
aws sts get-caller-identity

# ── 2. Infraestructura AWS ──────────────────────────────────────────
cd terraform/cluster
terraform init && terraform apply

cd ../addons
terraform init && terraform apply

# ── 3. Conectar kubectl ─────────────────────────────────────────────
aws eks update-kubeconfig --region us-east-1 --name innovatech-eks
kubectl get nodes

# ── 4. Push de imágenes a ECR ───────────────────────────────────────
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
ECR_BASE="$ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com"

aws ecr get-login-password --region us-east-1 \
  | docker login --username AWS --password-stdin $ECR_BASE

docker build -t $ECR_BASE/innovatech/backend-despachos:latest ./backend-despachos
docker push $ECR_BASE/innovatech/backend-despachos:latest

docker build -t $ECR_BASE/innovatech/backend-ventas:latest ./backend-ventas
docker push $ECR_BASE/innovatech/backend-ventas:latest

docker build -t $ECR_BASE/innovatech/frontend:latest ./frontend
docker push $ECR_BASE/innovatech/frontend:latest

# ── 5. Reemplazar placeholder de imágenes en los manifests ──────────
cd ../..
sed -i "s|PLACEHOLDER_DESPACHOS|$ECR_BASE/innovatech/backend-despachos:latest|g" \
  app-k8s/k8s/backend-despachos-deployment.yaml
sed -i "s|PLACEHOLDER_VENTAS|$ECR_BASE/innovatech/backend-ventas:latest|g" \
  app-k8s/k8s/backend-ventas-deployment.yaml
sed -i "s|PLACEHOLDER_FRONTEND|$ECR_BASE/innovatech/frontend:latest|g" \
  app-k8s/k8s/frontend-deployment.yaml

# ── 6. Aplicar manifests en orden ──────────────────────────────────
kubectl apply -f app-k8s/k8s/namespace.yaml --validate=false
sleep 2
kubectl apply -f app-k8s/k8s/mysql-secret.yaml --validate=false
kubectl apply -f app-k8s/k8s/mysql-deployment.yaml --validate=false
kubectl apply -f app-k8s/k8s/mysql-service.yaml --validate=false
kubectl apply -f app-k8s/k8s/backend-despachos-deployment.yaml --validate=false
kubectl apply -f app-k8s/k8s/backend-despachos-service.yaml --validate=false
kubectl apply -f app-k8s/k8s/backend-despachos-hpa.yaml --validate=false
kubectl apply -f app-k8s/k8s/backend-ventas-deployment.yaml --validate=false
kubectl apply -f app-k8s/k8s/backend-ventas-service.yaml --validate=false
kubectl apply -f app-k8s/k8s/backend-ventas-hpa.yaml --validate=false
kubectl apply -f app-k8s/k8s/frontend-deployment.yaml --validate=false
kubectl apply -f app-k8s/k8s/frontend-service.yaml --validate=false
kubectl apply -f app-k8s/k8s/frontend-hpa.yaml --validate=false
kubectl apply -f app-k8s/k8s/ingress.yaml --validate=false

# ── 7. Verificar estado ─────────────────────────────────────────────
kubectl get all -n innovatech
kubectl get ingress -n innovatech   # obtener URL pública del ALB
```

---

## 14. Validación Funcional

### Verificar pods corriendo

```bash
kubectl get pods -n innovatech
# Esperado: todos en Running, 0 o pocos restarts
```

### Obtener URL pública

```bash
kubectl get ingress -n innovatech
# Columna ADDRESS: k8s-innovatech-xxxx.us-east-1.elb.amazonaws.com
```

### Probar endpoints directamente

```bash
ALB_URL=$(kubectl get ingress innovatech-ingress -n innovatech \
  -o jsonpath='{.status.loadBalancer.ingress[0].hostname}')

# Frontend
curl -I http://$ALB_URL/

# Backend despachos
curl http://$ALB_URL/api/v1/despachos

# Backend ventas
curl http://$ALB_URL/api/v1/ventas
```

### Verificar comunicación interna (desde dentro del cluster)

```bash
# Entrar a un pod temporal
kubectl run debug --image=busybox -n innovatech --rm -it -- sh

# Dentro del pod, probar DNS interno:
wget -qO- http://backend-despachos-svc:8081/api/v1/despachos
wget -qO- http://backend-ventas-svc:8082/api/v1/ventas
wget -qO- http://mysql-svc:3306   # debe conectar (aunque no responda HTTP)
exit
```

### Verificar servicios y HPA

```bash
kubectl get svc -n innovatech
kubectl get hpa -n innovatech
kubectl describe hpa hpa-backend-despachos -n innovatech
```

### Verificar recuperación ante redeploy

```bash
# Forzar un rollout (simula lo que hace el CI/CD)
kubectl rollout restart deployment/backend-despachos -n innovatech

# Ver el rolling update en vivo (reemplaza pods de a uno sin downtime)
kubectl rollout status deployment/backend-despachos -n innovatech
```

---

## 15. Análisis de Logs y Métricas

### Logs con kubectl

```bash
# Logs en tiempo real de un servicio
kubectl logs -f -l app=backend-despachos -n innovatech

# Últimas 100 líneas de ventas
kubectl logs -l app=backend-ventas -n innovatech --tail=100

# Logs del pod anterior (útil para ver por qué crasheó)
kubectl logs <nombre-pod> -n innovatech --previous

# Todos los eventos del namespace ordenados por tiempo
kubectl get events -n innovatech --sort-by='.lastTimestamp'
```

### Logs en CloudWatch

El cluster tiene habilitado el addon `amazon-cloudwatch-observability`, que envía logs automáticamente.

Desde AWS Console: **CloudWatch → Log groups**

| Log Group | Contenido |
|-----------|-----------|
| `/aws/eks/innovatech-eks/cluster` | Logs del control plane (API server, scheduler, etc.) |
| `/aws/containerinsights/innovatech-eks/application` | Logs de los pods de aplicación |
| `/aws/containerinsights/innovatech-eks/performance` | Métricas de rendimiento |

Desde CLI:
```bash
# Listar log groups del cluster
aws logs describe-log-groups \
  --log-group-name-prefix "/aws/eks/innovatech-eks" \
  --query 'logGroups[].logGroupName'

# Ver logs recientes del cluster
aws logs tail /aws/eks/innovatech-eks/cluster --follow
```

### Métricas del pipeline en GitHub Actions

Cada ejecución del pipeline en GitHub → Actions muestra:
- Tiempo de cada job (build, push, deploy)
- Logs completos de cada step
- Estado de éxito/fallo por step
- Historial de todas las ejecuciones

Tiempos de referencia observados:
| Step | Tiempo aproximado |
|------|-------------------|
| Build backend-despachos | ~2-3 min |
| Build backend-ventas | ~2-3 min |
| Build frontend | ~1 min |
| Push a ECR (3 imágenes) | ~2 min |
| kubectl apply + rollout | ~2 min |
| **Total pipeline** | **~8-10 min** |

---

## 16. Desarrollo Local con Docker

Para testear localmente sin necesidad de AWS:

```bash
# Crear red compartida
docker network create innovatech-local

# Iniciar MySQL (si no lo tienes corriendo)
docker run -d \
  --name mysql-local \
  --network innovatech-local \
  -e MYSQL_ALLOW_EMPTY_PASSWORD=yes \
  -p 3306:3306 \
  mysql:8.0

# Crear bases de datos
docker exec mysql-local mysql -u root -e \
  "CREATE DATABASE IF NOT EXISTS db_despachos; CREATE DATABASE IF NOT EXISTS db_ventas;"

# Build y run backend-despachos
docker build -t despachos:local ./backend-despachos
docker run -d --name despachos-local --network innovatech-local -p 8081:8081 \
  -e DB_URL="jdbc:mysql://mysql-local:3306/db_despachos?useSSL=false&allowPublicKeyRetrieval=true" \
  -e DB_USER="root" -e DB_PASS="" \
  despachos:local

# Build y run backend-ventas
docker build -t ventas:local ./backend-ventas
docker run -d --name ventas-local --network innovatech-local -p 8082:8082 \
  -e DB_ENDPOINT="mysql-local" -e DB_PORT="3306" -e DB_NAME="db_ventas" \
  -e DB_USERNAME="root" -e DB_PASSWORD="" \
  ventas:local

# Build y run frontend (con nginx.local.conf para proxy a los contenedores locales)
docker build -t frontend:local ./frontend
docker run -d --name frontend-local --network innovatech-local -p 3000:80 \
  -v $(pwd)/frontend/nginx.local.conf:/etc/nginx/conf.d/default.conf \
  frontend:local

# Verificar
docker ps
curl http://localhost:8081/api/v1/despachos
curl http://localhost:8082/api/v1/ventas
# Abrir http://localhost:3000 en el browser

# Limpiar
docker stop mysql-local despachos-local ventas-local frontend-local
docker rm mysql-local despachos-local ventas-local frontend-local
docker network rm innovatech-local
```

### Variables de entorno por entorno

| Variable | Local (.env) | Producción (.env.production) |
|----------|-------------|------------------------------|
| `VITE_API_DESPACHOS` | `http://localhost:8081/api/v1/despachos` | `/api/v1/despachos` |
| `VITE_API_VENTAS` | `http://localhost:8082/api/v1/ventas` | `/api/v1/ventas` |

En producción, las URLs son relativas para que el proxy de Nginx las intercepte internamente.

---

## 17. Problemas Encontrados y Soluciones

### P1: `jq: not found` al correr `terraform plan`

**Causa:** El script de Terraform que lee credenciales del entorno usa `jq`, que no viene preinstalado en Linux Mint.

**Solución:**
```bash
sudo apt-get install -y jq
```

---

### P2: Helm timeout al instalar AWS Load Balancer Controller

**Error:** `error validating data: failed to download openapi: unexpected error when reading response body`

**Causa:** El provider de Helm intenta validar los manifests contra el schema OpenAPI del API server de EKS, pero la conexión se interrumpe durante la descarga del schema (problema de latencia con AWS Academy, no un timeout real).

**Solución:** Deshabilitar la validación OpenAPI en el recurso de Helm:
```hcl
resource "helm_release" "aws_load_balancer_controller" {
  disable_openapi_validation = true
  lint                       = false
  ...
}
```

---

### P3: `kubectl apply` falla con "namespace not found" aunque el namespace se creó en el mismo comando

**Causa:** `kubectl apply -f directorio/` procesa los archivos en orden alfabético. Los deployments (b-backend-*) se procesan antes de que el namespace (n-namespace) esté propagado en el API server.

**Solución:** Aplicar el namespace explícitamente primero, con un pequeño delay:
```bash
kubectl apply -f app-k8s/k8s/namespace.yaml --validate=false
sleep 2
kubectl apply -f app-k8s/k8s/ --validate=false
```

---

### P4: `kubectl apply` falla con validación OpenAPI (mismo error que Helm)

**Causa:** Igual que P2, el `kubectl` también descarga el schema OpenAPI para validar los YAML antes de aplicarlos. AWS Academy introduce latencia que interrumpe esa descarga.

**Solución:**
```bash
kubectl apply -f app-k8s/k8s/ --validate=false
```

El flag `--validate=false` omite la validación del schema y aplica los manifests directamente. Los YAML ya fueron validados en su creación.

---

### P5: MySQL en estado `Pending` indefinidamente

**Causa:** El `PersistentVolumeClaim` no tenía `storageClassName` especificada, y aunque existe la StorageClass `gp2` en el cluster, no está marcada como default. Adicionalmente, el Amazon EBS CSI Driver no estaba instalado.

**Intento de solución:** Se intentó instalar el addon `aws-ebs-csi-driver` via AWS CLI, pero el rol `LabRole` de AWS Academy no tiene el policy `AmazonEBSCSIDriverPolicy`, por lo que el controller del driver arrancaba pero fallaba con `AccessDenied` al intentar crear volúmenes EBS.

**Solución final:** Reemplazar el `PersistentVolumeClaim` por `emptyDir` en el Deployment de MySQL:
```yaml
volumes:
  - name: mysql-data
    emptyDir: {}   # datos en memoria, no persisten entre reinicios del pod
```

**Impacto:** Los datos de MySQL se pierden si el pod se reinicia. Aceptable para este entorno de laboratorio donde la prioridad es demostrar la orquestación y el CI/CD, no la persistencia de datos.

---

### P6: Backends en `CrashLoopBackOff` al arrancar

**Causa:** Los pods de Spring Boot intentaron conectar a MySQL durante su arranque, pero MySQL aún no estaba `Running` (estaba en `Pending` o `Init`). Spring Boot no reintenta la conexión de arranque y termina con error.

**Solución inmediata:** Reiniciar los deployments de backends una vez que MySQL esté `Running`:
```bash
kubectl rollout restart deployment backend-despachos -n innovatech
kubectl rollout restart deployment backend-ventas -n innovatech
```

**Solución permanente (implementada):** Agregar un `initContainer` en los deployments de los backends que espera activamente a que MySQL esté disponible antes de iniciar Spring Boot:
```yaml
initContainers:
  - name: wait-for-mysql
    image: busybox:1.36
    command: ['sh', '-c', 'until nc -z mysql-svc 3306; do sleep 3; done']
```

---

### P7: Contenedores Docker locales no se conectan entre sí

**Causa:** Al crear contenedores con `docker run` sin especificar `--network`, cada contenedor queda en redes separadas y no pueden comunicarse por nombre.

**Solución:**
```bash
docker network create innovatech-local
# Especificar --network innovatech-local en cada docker run
# O conectar un contenedor existente: docker network connect innovatech-local <nombre>
```

---

## 18. Decisiones de Diseño y Justificaciones

### ¿Por qué EKS y no ECS?

EKS fue elegido sobre ECS por las siguientes razones:
- **HPA nativo:** Kubernetes incluye el Horizontal Pod Autoscaler como recurso de primera clase. En ECS requiere configuración adicional con Application Auto Scaling.
- **`kubectl logs` directo:** La observabilidad con kubectl es más directa e interactiva para fines de evaluación y debugging.
- **Manifests YAML declarativos:** Los manifests de K8s son portables, versionables y directamente verificables en el repositorio.
- **Ecosistema:** EKS es el estándar de la industria para orquestación de contenedores en AWS.

### ¿Por qué dos módulos Terraform separados (cluster/ y addons/)?

La separación existe porque los providers de Kubernetes y Helm requieren que el cluster EKS ya exista para autenticarse. Si ambos estuvieran en el mismo módulo, `terraform plan` fallaría en un cluster nuevo porque no puede resolver las credenciales del cluster.

El flujo de dos pasos garantiza que: 1) la infraestructura AWS (VPC, EKS, ECR) se crea sin dependencias de Kubernetes, y 2) los addons de Kubernetes se instalan sobre un cluster ya operativo.

### ¿Por qué 50% CPU como umbral del HPA?

Con un umbral del 50% se garantiza que hay capacidad de reserva para absorber picos de tráfico mientras los nuevos pods están arrancando (Spring Boot tarda ~30 segundos en estar listo). Un umbral más alto (70-80%) podría causar degradación durante el tiempo de arranque de los pods nuevos.

### ¿Por qué instancias t3.medium SPOT?

- **SPOT:** Reduce costos hasta un 70% respecto a instancias On-Demand. Aceptable para un entorno de laboratorio donde la disponibilidad no es crítica.
- **t3.medium (2 vCPU, 4GB RAM):** Suficiente para correr 4 pods de aplicación (2 réplicas de 2 backends + 2 de frontend + MySQL) dentro de los créditos del lab.

### ¿Por qué nginx hace el proxy a los backends en lugar de llamarlos directamente desde el browser?

Si el frontend llamara directamente a los backends, el browser necesitaría la URL pública de cada backend (lo que requeriría un Load Balancer o NodePort por servicio). Con el proxy en nginx:
- Un solo punto de entrada público (el ALB del frontend)
- Los backends quedan en ClusterIP (no expuestos a internet)
- Se eliminan problemas de CORS (las llamadas son servidor a servidor, no browser a servidor)
- La configuración de red es más segura y limpia

---

*Evaluación Parcial N°3 — ISY1101 Introducción a Herramientas DevOps — DuocUC 2025*

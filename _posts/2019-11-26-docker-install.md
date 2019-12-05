---
layout: post
title: CentOS 安装 Docker
description:  CentOS 安装 Docker
categories: Docker
keywords: Docker,CentOS
excerpt:  Docker,CentOS
---

# 安装 Docker


## 1、安装依赖
yum install -y yum-utils device-mapper-persistent-data lvm2

## 2、配置yum 仓库


yum-config-manager  --add-repo https://download.docker.com/linux/centos/docker-ce.repo


## 3、安装docker

docker-ce : The Docker Engine - Community

yum install docker-ce

## 4、启动docker

systemctl enable docker

systemctl start docker

systemctl status docker


## 5、验证docker 

 sudo docker run hello-world


## 6、修改docker 镜像地址


默认docker image 镜像网络访问不了（或者慢），这里配置阿里云的镜像地址


vim /etc/docker/daemon.json


```json
{

     "registry-mirrors":  ["https://aekshq8n.mirror.aliyuncs.com"]

}
```



##  7、卸载docker:

sudo yum remove docker-ce

sudo rm -rf /var/lib/docker

---
layout: post
title: Spark 2.0 安装部署
description: Spark 2.0 安装部署
categories: Spark
keywords: spark，big data
---

## Spark 2.0 安装部署

#### **选择下载安装包**
	
可以在[这里](http://spark.apache.org/downloads.html)下载相应版本的安装包。

此处如下：

![](/resources/pictures/spark-install-intro/spark_download.png "选择页面")

#### **配置Spark**
	
将文件上传到各个节点，然后解压

`tar -zxvf spark-2.0.0-bin-hadoop2.6.tgz`

配置SPARK_HOME

```bash
export SPARK_HOME=/home/utf7/spark-2.0.0-bin-hadoop2.6	
export PATH=$SPARK_HOME/bin:$PATH
```

修改配置文件:
进入spark 安装目录

- spark-env.sh

```bash
cd conf
cp spark-env.sh.template spark-env.sh
vi spark
export SPARK_HOME=/home/utf7/spark-2.0.0-bin-hadoop2.6
export HADOOP_CONF_DIR=/home/utf7/hadoop/etc/hadoop
export SPARK_MASTER_IP=master
export SPARK_MASTER_PORT=7077
export SPARK_MASTER_WEBUI_PORT=8090
export SPARK_WORKER_CORES=2
export SPARK_WORKER_MEMORY=1g
export SPARK_WORKER_PORT=8091
export SPARK_LOG_DIR=$SPARK_HOME/logs/spark
export SPARK_PID_DIR=$SPARK_HOME/tmp/spark
```
- slaves
```bash
cat slaves  
yc3
```

- log4j.properties  

`cp log4j.properties.template log4j.properties`
  
根据需要修改，此处没有修改

- 引入hadoop配置
  此处将core-site.xml和hdfs-site.xml 复制到了spark的conf目录下面。应该也可以通过其他方式去做
将修改的文件同步到所有的节点中


#### **启动**

```bash
cd $SPARK_HOME/sbin
./start-all.sh
```

#### **查看启动日志**
日志记录在$SPARK_HOME/logs/spark目录下面

#### **测试**

- 查看spark管理页面：
http://master:8090



#### **访问Spark**
- 使用spark-shell

首先，将spark的README.MD上传到hdfs上，后面我们需要用,上传文件：

`hdfs dfs -put /home/utf7/spark-2.0.0-bin-hadoop2.6/README.md /home/utf7/README.md`

```bash
cd $SPARK_HOME/bin

./spark-shell

scala>var textFile = sc.textFile("/user/utf7/README.md")
textFile: org.apache.spark.rdd.RDD[String] = /user/utf7/README.md MapPartitionsRDD[7] at textFile at <console>:24

scala>textFile.count()
res2: Long = 99

scala> textFile.first()
res3: String = # Apache Spark

scala> val linesWithSpark = textFile.filter(line => line.contains("Spark"))
linesWithSpark: org.apache.spark.rdd.RDD[String] = MapPartitionsRDD[8] at filter at <console>:26

scala>  textFile.filter(line => line.contains("Spark")).count()
res4: Long = 19
```
更多，请参考[quick-start](http://spark.apache.org/docs/latest/quick-start.html)

#### **编写Spark程序**

使用maven管理包依赖：

- pom.xml

```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 http://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>

    <groupId>com.utf7</groupId>
    <artifactId>sparkLearn</artifactId>
    <version>1.0</version>
    <build>
        <plugins>
            <plugin>
                <groupId>org.apache.maven.plugins</groupId>
                <artifactId>maven-compiler-plugin</artifactId>
                <configuration>
                    <source>1.7</source>
                    <target>1.7</target>
                </configuration>
            </plugin>
        </plugins>
    </build>
    <dependencies>
        <dependency>
            <groupId>org.apache.spark</groupId>
            <artifactId>spark-core_2.11</artifactId>
            <version>2.0.0</version>
        </dependency>
        <dependency>
            <groupId>org.apache.spark</groupId>
            <artifactId>spark-sql_2.11</artifactId>
            <version>2.0.0</version>
        </dependency>
        <dependency>
            <groupId>org.apache.hadoop</groupId>
            <artifactId>hadoop-client</artifactId>
            <version>2.6.0</version>
        </dependency>
        <dependency>
            <groupId>mysql</groupId>
            <artifactId>mysql-connector-java</artifactId>
            <version>5.1.30</version>
        </dependency>
    </dependencies>
</project>
```


- 使用Java RDD API


```java
import org.apache.spark.SparkConf;
import org.apache.spark.api.java.JavaRDD;
import org.apache.spark.api.java.JavaSparkContext;
import org.apache.spark.api.java.function.Function;
import org.apache.spark.api.java.function.Function2;

/**
 * show how to use javardd api 
 */

public class HelloSparkJavaRDD {

    public final static String MASTER = "spark://master:7077";

    public static void main(String[] args) {
        SparkConf conf = new SparkConf().setAppName("helloSparkJava").setMaster(MASTER);
        JavaSparkContext sc = new JavaSparkContext(conf);
        JavaSparkContext.jarOfClass(HelloSparkJavaRDD.class);
        JavaRDD<String> lines = sc.textFile("README.md");
        //java8
        JavaRDD<Integer> lineLengths = lines.map(new Function<String, Integer>() {
            @Override
            public Integer call(String v1) throws Exception {
                return v1.length();
            }
        });
        int totalLength = lineLengths.reduce(new Function2<Integer, Integer, Integer>() {
            @Override
            public Integer call(Integer v1, Integer v2) throws Exception {
                return v1 + v2;
            }
        });
        System.out.println("total length is :" + totalLength);
       /*  final String spark = "Spark";
        long numSpark= lines.filter(new Function<String, Boolean>() {
            public Boolean call(String v1) throws Exception {
                return v1.contains(spark);
            }
        }).count();
       System.out.println("find word '" + spark + "':" + numSpark);*/

    }
}
```


更加请参考:[resilient-distributed-datasets-rdds](http://spark.apache.org/docs/latest/programming-guide.html#resilient-distributed-datasets-rdds)


- 使用Java Spark SQL API


```java
import org.apache.spark.api.java.function.MapFunction;
import org.apache.spark.sql.Column;
import org.apache.spark.sql.Dataset;
import org.apache.spark.sql.Encoder;
import org.apache.spark.sql.Encoders;
import org.apache.spark.sql.Row;
import org.apache.spark.sql.SparkSession;

import java.io.Serializable;
import java.sql.Timestamp;
import java.util.Arrays;
import java.util.Collections;
import java.util.Properties;

/**
 * Created by utf7 on 2016/9/19.
 * show how to user spark sql api
 */

public class HelloSparkJavaSQL {

    public static void main(String[] args) {

        SparkSession spark = SparkSession.builder().appName("Java Spark SQL Example " + new Timestamp(System.currentTimeMillis())).config("spark.some.config.option", "some-value").getOrCreate();
        Dataset<Row> df = spark.read().json("file:/home/utf7/spark-2.0.0-bin-hadoop2.6/examples/src/main/resources/people.json");
        System.out.println("show df:");
        df.show();
        System.out.println("show printSchema:");
        df.printSchema();
        System.out.println("select name:");
        df.select("name").show();
        System.out.println("select name,age+1 :");
        df.select(new Column("name"), new Column("age").plus(1)).show();
        System.out.println("select age >21:");
        df.filter(new Column("age").gt(21)).show();
        System.out.println("select age,count(*) group by age :");
        df.groupBy("age").count().show();

        System.out.println("show how create view and select from the view:");
        df.createOrReplaceTempView("people");
        Dataset<Row> sqlDF = spark.sql("select * from people");
        sqlDF.show();

        System.out.println("show how to use dataset:");
        testDatasets(spark);
        testReadFromMySQL(spark);
    }


    /**
     * show how to read from rdms use jdbc,here is mysql
     * @param spark
     */
    public static void testReadFromMySQL(SparkSession spark) {
        String MYSQL_CONNECTION_URL = "jdbc:mysql://yc1:3306/test";
        String MYSQL_USERNAME = "utf7";
        String MYSQL_PWD = "utf7";
        String TABLE_NAME = "user";
        Person person = new Person();
        person.setName("utf7");
        person.setAge(28);
        // Encoders are created for Java beans

        Encoder<Person> personEncoder = Encoders.bean(Person.class);
        final Properties connectionProperties = new Properties();
        connectionProperties.put("user", MYSQL_USERNAME);
        connectionProperties.put("password", MYSQL_PWD);

        System.out.println("show how read from mysql:");
        Dataset<Person> peopleDS = spark.read().jdbc(MYSQL_CONNECTION_URL, TABLE_NAME, connectionProperties).as(personEncoder);
        peopleDS.show();

    }

    /**
     * show how to convert file to dataset,here is local file "file://..."
     * @param spark
     */
    public static void testDatasets(SparkSession spark) {
        Person person = new Person();
        person.setName("utf7");
        person.setAge(28);
        // Encoders are created for Java beans
        Encoder<Person> personEncoder = Encoders.bean(Person.class);
        Dataset<Person> javaBeanDS = spark.createDataset(Collections.singletonList(person), personEncoder);
        javaBeanDS.show();
        // +---+----+
        // |age|name|
        // +---+----+
        // | 32|Andy|
        // +---+----+


        // Encoders for most common types are provided in class Encoders
        Encoder<Integer> integerEncoder = Encoders.INT();
        Dataset<Integer> primitiveDS = spark.createDataset(Arrays.asList(1, 2, 3), integerEncoder);
        Dataset<Integer> transformedDS = primitiveDS.map(new MapFunction<Integer, Integer>() {
            @Override
            public Integer call(Integer value) throws Exception {
                return value + 1;
            }
        }, integerEncoder);
        transformedDS.collect();// Returns [2,3,4]

        // DataFrames can be converted to a Dataset by providing a class. Mapping based on name
        String path = "file:/home/utf7/spark-2.0.0-bin-hadoop2.6/examples/src/main/resources/people.json";
        Dataset<Person> peopleDS = spark.read().json(path).as(personEncoder);
        peopleDS.show();
        // +----+-------+
        // | age|   name|
        // +----+-------+
        // |null|Michael|
        // |  30|   Andy|
        // |  19| Justin|
        // +----+-------+

    }


    public static class Person implements Serializable {
        private String name;
        private int age;

        public String getName() {
            return this.name;
        }

        public void setName(String name) {
            this.name = name;
        }

        public int getAge() {
            return age;
        }

        public void setAge(int age) {
            this.age = age;
        }
    }
}
```


更多请参考：[sql-programming-guide](http://spark.apache.org/docs/latest/sql-programming-guide.html)



- 提交spark jar脚本

将上面的程序打包，放到spark环境中执行，执行脚本为：

```bash
#!/usr/bin/env bash
# you can use this script to run spark app:
# ./runSpark.sh runRDD : run RDD example
# ./runSpark.sh runSQL : run SQL example
export JAR_HOME=/home/utf7/
function runRDD(){
  $SPARK_HOME/bin/spark-submit \
  --class "HelloSparkJavaRDD" \
  --executor-memory 128m \
  --total-executor-cores 1 \
  $JAR_HOME/sparkLearn-1.0.jar
}

function runSQL(){
  $SPARK_HOME/bin/spark-submit \
  --class "HelloSparkJavaSQL" \
  --executor-memory 128m \
  --total-executor-cores 1 \
  $JAR_HOME/sparkLearn-1.0.jar
}


if [ $# -gt 0 ]
then
        $@
        exit 0
fi

echo "GUIDE:"
echo "USE runRDD/runSQL"
```


$ ./runSpark.sh runRDD ,执行如上命令，spark rdd 示例输出如下：


```bash
16/09/26 17:44:41 WARN NativeCodeLoader: Unable to load native-hadoop library for your platform... using builtin-java classes where applicable
total length is :3729
```

$./runSpark.sh runSQL 执行如上命令，使用spark sql示例输出如下：

```bash
16/09/26 17:39:31 WARN NativeCodeLoader: Unable to load native-hadoop library for your platform... using builtin-java classes where applicable
16/09/26 17:39:32 WARN Utils: Service 'SparkUI' could not bind on port 4040. Attempting port 4041.
16/09/26 17:39:32 WARN SparkContext: Use an existing SparkContext, some configuration may not take effect.
show df:                                                                        
+----+-------+
| age|   name|
+----+-------+
|null|Michael|
|  30|   Andy|
|  19| Justin|
+----+-------+

show printSchema:
root
 |-- age: long (nullable = true)
 |-- name: string (nullable = true)

select name:
+-------+
|   name|
+-------+
|Michael|
|   Andy|
| Justin|
+-------+

select name,age+1 :
+-------+---------+
|   name|(age + 1)|
+-------+---------+
|Michael|     null|
|   Andy|       31|
| Justin|       20|
+-------+---------+

select age >21:
+---+----+
|age|name|
+---+----+
| 30|Andy|
+---+----+

select age,count(*) group by age :
+----+-----+                                                                    
| age|count|
+----+-----+
|  19|    1|
|null|    1|
|  30|    1|
+----+-----+

show how create view and select from the view:
+----+-------+
| age|   name|
+----+-------+
|null|Michael|
|  30|   Andy|
|  19| Justin|
+----+-------+

show how to use dataset:
+---+-----+
|age| name|
+---+-----+
| 28|seven|
+---+-----+

+----+-------+
| age|   name|
+----+-------+
|null|Michael|
|  30|   Andy|
|  19| Justin|
+----+-------+

show how read from mysql:
+-------+---+
|   name|age|
+-------+---+
| seven|  1|
|  utf7| 28|
+-------+---+
```






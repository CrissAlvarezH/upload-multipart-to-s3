## Descripción
En este proyecto se expone una forma de subir archivos grandes a aws s3 por partes usando url prefirmadas evitando pasar por servicios propios para no tener problemas de storage o timeout

## Proceso
La idea principal es llevar el procesamiento del archivo al frontend, el cual será encargado de partir el archivo y enviar cada parte directamente a aws s3, para esto requerirá de urls
prefirmadas las cuales consultará al backend. El backend se encargará de generar las urls prefirmadas para cada parte del archivo a subir así como tambien de comunicarse con s3 para 
notificar que todas las partes han sido subidas exitosamente, completando así el proceso.

<img width="500px" src='https://github.com/CrissAlvarezH/upload-multipart-to-s3/blob/main/docs/images/upload_process_diagram.png'/>

Es posible ejecutar asincronamente el envío de cada parte, tambien se puede configurar el envio por batches, de esta forma si deseamos enviar de 3 partes al tiempo se vería de la siguiente manera:

<img src='https://github.com/CrissAlvarezH/upload-multipart-to-s3/blob/main/docs/images/uploading_file.png'/>

Una vez completada la subida de todas las partes el frontend realiza una llamada final a `/complete`

<img src='https://github.com/CrissAlvarezH/upload-multipart-to-s3/blob/main/docs/images/upload_completed.png'/>

## Requerimientos
Aparte de tener credenciales de aws con permisos suficiente para subir archivos ya sea cargados por sesión o por variables de entorno directamente en el codigo, tambien será
necesario configurar los CORS del bucket para aceptar por un lado la subida directa del frontend así como tambien la lectura del header Etag que permite identficar cada parte subida.
La configuración se ve de la siguiente manera en la consola de aws:

```json
[
    {
        "AllowedHeaders": [
            "*"
        ],
        "AllowedMethods": [
            "PUT"
        ],
        "AllowedOrigins": [
            "http://localhost:3000"
        ],
        "ExposeHeaders": [
            "Etag"
        ]
    }
]
```
> Esta configuración se encuentra en: AWS S3 > Bucker > Permissions tab > CORS configuration

## Correr localmente

```bash
npm run dev
```

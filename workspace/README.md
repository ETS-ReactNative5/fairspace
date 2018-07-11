# A Helm chart for VRE workspaces
This helm chart will install and setup a single VRE workspace. It includes
an instance of JupyterHub and Minio.

Contains:
- JupyterHub with Python 3 and R kernels and JupyterLab extension
- Mercury
- Minio

## Prerequisites
A workspace within Fairspace is always associated with a hyperspace. The
hyperspace contains shared components, such as Keycloak for authentication.
The connection to the hyperspace should be configured when installing this chart.

Additionally, the following requirements should be met.
- If ingress is enabled, an active ingress controller should be present in the cluster. 
- If a TLS certificate is to be obtained automatically, an installation of `cert-manager` should be present in the cluster. See
  https://cert-manager.readthedocs.io/en/latest/getting-started/2-installing.html#with-helm for the easiest way to set it up. Please
  note that the certificate that is being created, relies on a dns01 challenge provider being configured properly, as well as on a 
  certificate issuer being setup. See the [cert-manager docs](https://cert-manager.readthedocs.io) for more information.

## How to install
First create a configuration file with settings for the workspace to install. For example:

```yaml
hyperspace:
    domain: hyperspace.ci.test.fairdev.app
    keycloak:
        username: keycloak
        password: abcdefghi
        realm: hyperspace

workspace:
    testuser:
        password: secret-password

jupyterhub:
    proxy:
        secretToken: 3fca8159e7e0c07db4f6601799d961e82836965bf2b5d7a4310b7686cb18762e
        
pluto:
    keycloak:
        baseUrl: https://keycloak.hyperspace.ci.test.fairdev.app
        realm: hyperspace     
        
minio:
  accessKey: IFGZ2M0W8LB0C92FYA3J
  secretKey: xzow1FrinP+oJYEpHP3s6NzayewFFOgAf/nudLSB
```

After that, you can install the chart using helm. More details on the parameters can be found below.

```
helm repo add chartmuseum https://chartmuseum.jx.test.fairdev.app/
helm repo update
helm install --name=melanoma-workspace chartmuseum/workspace --namespace=workspaces -f config.yaml
```

## Install on minikube
By default, on minikube one would want to run the system without TLS and ingresses. An example
configuration file would be something like

```yaml
# Provide your own hyperspace settings here
hyperspace:
    tls: false
    locationOverrides:
        keycloak: http://192.168.99.100:30867 
    keycloak:
        username: keycloak
        password: abcdefghi
        realm: hyperspace

workspace:
    ingress:
        enabled: false

pluto:
    service:
        type: NodePort
    keycloak:
        # Provide your own keycloak settings here
        baseUrl: http://192.168.99.100:30867
        realm: hyperspace
        
minio:
  accessKey: IFGZ2M0W8LB0C92FYA3J
  secretKey: xzow1FrinP+oJYEpHP3s6NzayewFFOgAf/nudLSB
```

It can be installed in the same way as above.
```
helm repo add chartmuseum https://chartmuseum.jx.test.fairdev.app/
helm repo update
helm install --name=workspace chartmuseum/workspace --namespace=workspace -f config.yaml
```

## Using the configuration scripts

You can use a configuration script to create a configuraion file and perform initial setup:

`./config.sh`

After that you can adjust the configuration:

`vi <workspace-name>-config.yaml`

Finally, you can use the installation script to actually install the workspace. Please note that you 
must use the exact same workspace name as in the configuration script.

`./install.sh`

## Configuration
Use `helm ... -f config.yaml` to override default configuration parameters from `values.yaml`. This section
describes the most important settings for a workspace. See the `values.yaml` file for more settings.

#### Workspace parameters
| Parameter  | Description  | Default |
|---|---|---|
| `nameOverride`  | Unique name for the workspace to install. Please note that if you override the name, also set `pluto.workspace.name` | <release name> |
| `workspace.testuser.username`  | Username for the testuser that will be created for this workspace | `test-<workspace_name>` |
| `workspace.testuser.password`  | Password for the testuser for this workspace | `fairspace123` |
| `workspace.ingress.enabled`  | Whether or not an ingress is setup for the workspace components. Should be set to false when running locally.  | true |
| `workspace.ingress.domain`   | Domain that is used for setting up the workspace. Is used as postfix for the hostname for the specific components. For example setting `fairspace.app` as domain will setup jupyterhub at `jupyterhub.fairspace.app`  | workspace.ci.test.fairdev.app  |
| `workspace.ingress.tls.enabled`  | Whether or not an TLS is enabled on the ingresses for workspace  | true  |
| `workspace.ingress.tls.secretNameOverride`  | If set, this secret name is used for loading certificates for TLS. | `tls-<release name>` |
| `workspace.ingress.tls.certificate.obtain`  | If set, a `Certificate` object will be created, such that [cert-manager](https://cert-manager.readthedocs.io/en/latest/) will request a certificate automatically. | true |

#### Hyperspace parameters
| Parameter  | Description  | Default |
|---|---|---|
| `hyperspace.tls`  | Whether or not the hyperspace uses tls. Is used for automatic creation of hyperspace urls | true |
| `hyperspace.domain` | Domain that is used for the hyperspace. Should only include the domain postfix, that was used when installing the hyperspace. Is used as postfix for the hostname for the specific components. For example setting `hyperspace.fairspace.app` as domain will try to lookup keycloak at `keycloak.hyperspace.fairspace.app`  | hyperspace.ci.test.fairdev.app  |
| `hyperspace.locationOverrides.keycloak` | Optional override for the location of keycloak. Can be used if it runs on a non-standard location. Must include the scheme as well. For example: `http://192.168.99.100:30867` | (Generate url from `hyperspace.domain` property) |
| `hyperspace.keycloak.username`  | Username used for setting up keycloak users. Must have access to the master realm | |
| `hyperspace.keycloak.password`  | Password used for setting up keycloak users. | |
| `hyperspace.keycloak.realm`  | Keycloak realm that is used for this hyperspace. Also set this variable in `pluto.keycloak.realm`| |

#### Pluto parameters
| Parameter  | Description  | Default |
|---|---|---|
| `pluto.keycloak.baseUrl` | Base url of the keycloak installation, with scheme, without /auth. For example: `https://keycloak.hyperspace.fairspace.app`  |   |
| `pluto.keycloak.realm`   | Keycloak realm that is used for this hyperspace.  |   |
| `pluto.keycloak.redirectAfterLogoutUrl`   | URL to redirect the user to after logging out  |   |

#### Minio parameters
| Parameter  | Description  | Default |
|---|---|---|
| `minio.accessKey` | Default access key (5 to 20 characters) for Minio | IFGZ2M0W8LB0C92FYA3J |
| `minio.secretKey` | Default secret key (8 to 40 characters) for Minio | xzow1FrinP+oJYEpHP3s6NzayewFFOgAf/nudLSB |
| `minio.persistence.enabled` | Use persistent volume to store data | true |



#### Tool configuration
Configuration settings for specific applications should be put under a corresponding section in config.yaml:

* Jupyterhub
Settings for jupyterhub should be in the section `jupyterhub`. 
See [Jupyterhub docs](http://zero-to-jupyterhub.readthedocs.io/en/latest/user-environment.html) for more information on the specific settings

* Pluto
Settings for pluto should be in the section `pluto`. 
See [Pluto README](https://github.com/fairspace/pluto/blob/master/README.md) for more information on the specific settings

* Mercury
Settings for mercury should be in the section `mercury`. 
See [Mercury README](https://github.com/fairspace/mercury/blob/master/README.md) for more information on the specific settings

* Minio
Setting for minio should be in the section `minio`.
See [Minio README](https://github.com/kubernetes/charts/blob/master/stable/minio/README.md) for more information on the specific settings
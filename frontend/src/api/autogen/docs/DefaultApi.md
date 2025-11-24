# DefaultApi

All URIs are relative to *https://api.example.com*

|Method | HTTP request | Description|
|------------- | ------------- | -------------|
|[**authCheckGet**](#authcheckget) | **GET** /authCheck | Check if the user is authenticated and receive user info in that case|
|[**friendRequestCreatePost**](#friendrequestcreatepost) | **POST** /friend-request/create | Send a friend request|
|[**friendRequestIdAcceptPost**](#friendrequestidacceptpost) | **POST** /friend-request/{id}/accept | Accept a pending friend request|
|[**friendRequestIdCancelPost**](#friendrequestidcancelpost) | **POST** /friend-request/{id}/cancel | Cancel a pending friend request|
|[**friendRequestIdRejectPost**](#friendrequestidrejectpost) | **POST** /friend-request/{id}/reject | Reject a pending friend request|
|[**friendRequestsGet**](#friendrequestsget) | **GET** /friend-requests | Get frend requests for the authenticated user|
|[**friendsFriendUsernameDelete**](#friendsfriendusernamedelete) | **DELETE** /friends/{friend_username} | Delete a friend connection|
|[**friendsGet**](#friendsget) | **GET** /friends | List usernames of confirmed friends|
|[**locationPost**](#locationpost) | **POST** /location | Report current position and retrieve recent friend locations|
|[**loginPost**](#loginpost) | **POST** /login | Authenticate a user and receive a session cookie|
|[**logoutPost**](#logoutpost) | **POST** /logout | Logout the authenticated user|
|[**signupPost**](#signuppost) | **POST** /signup | Create a new user account|

# **authCheckGet**
> AuthCheckResponse authCheckGet()


### Example

```typescript
import {
    DefaultApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new DefaultApi(configuration);

const { status, data } = await apiInstance.authCheckGet();
```

### Parameters
This endpoint does not have any parameters.


### Return type

**AuthCheckResponse**

### Authorization

[cookieAuth](../README.md#cookieAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | User is authenticated |  -  |
|**401** | User is not authenticated |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **friendRequestCreatePost**
> GenericSuccess friendRequestCreatePost(friendRequestCreate)


### Example

```typescript
import {
    DefaultApi,
    Configuration,
    FriendRequestCreate
} from './api';

const configuration = new Configuration();
const apiInstance = new DefaultApi(configuration);

let friendRequestCreate: FriendRequestCreate; //

const { status, data } = await apiInstance.friendRequestCreatePost(
    friendRequestCreate
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **friendRequestCreate** | **FriendRequestCreate**|  | |


### Return type

**GenericSuccess**

### Authorization

[cookieAuth](../README.md#cookieAuth)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | Request created |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **friendRequestIdAcceptPost**
> GenericSuccess friendRequestIdAcceptPost()


### Example

```typescript
import {
    DefaultApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new DefaultApi(configuration);

let id: string; //Friend request identifier (default to undefined)

const { status, data } = await apiInstance.friendRequestIdAcceptPost(
    id
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **id** | [**string**] | Friend request identifier | defaults to undefined|


### Return type

**GenericSuccess**

### Authorization

[cookieAuth](../README.md#cookieAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | Friend added |  -  |
|**404** | Request not found |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **friendRequestIdCancelPost**
> GenericSuccess friendRequestIdCancelPost()


### Example

```typescript
import {
    DefaultApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new DefaultApi(configuration);

let id: string; //Friend request identifier (default to undefined)

const { status, data } = await apiInstance.friendRequestIdCancelPost(
    id
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **id** | [**string**] | Friend request identifier | defaults to undefined|


### Return type

**GenericSuccess**

### Authorization

[cookieAuth](../README.md#cookieAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | Request canceled |  -  |
|**404** | Request not found |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **friendRequestIdRejectPost**
> GenericSuccess friendRequestIdRejectPost()


### Example

```typescript
import {
    DefaultApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new DefaultApi(configuration);

let id: string; //Friend request identifier (default to undefined)

const { status, data } = await apiInstance.friendRequestIdRejectPost(
    id
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **id** | [**string**] | Friend request identifier | defaults to undefined|


### Return type

**GenericSuccess**

### Authorization

[cookieAuth](../README.md#cookieAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | Request rejected |  -  |
|**404** | Request not found |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **friendRequestsGet**
> FriendRequests friendRequestsGet()


### Example

```typescript
import {
    DefaultApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new DefaultApi(configuration);

const { status, data } = await apiInstance.friendRequestsGet();
```

### Parameters
This endpoint does not have any parameters.


### Return type

**FriendRequests**

### Authorization

[cookieAuth](../README.md#cookieAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | Array of friend requests |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **friendsFriendUsernameDelete**
> GenericSuccess friendsFriendUsernameDelete()


### Example

```typescript
import {
    DefaultApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new DefaultApi(configuration);

let friendUsername: string; //Username of the friend to remove (default to undefined)

const { status, data } = await apiInstance.friendsFriendUsernameDelete(
    friendUsername
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **friendUsername** | [**string**] | Username of the friend to remove | defaults to undefined|


### Return type

**GenericSuccess**

### Authorization

[cookieAuth](../README.md#cookieAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | Friend removed |  -  |
|**404** | Friend not found |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **friendsGet**
> Array<string> friendsGet()


### Example

```typescript
import {
    DefaultApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new DefaultApi(configuration);

const { status, data } = await apiInstance.friendsGet();
```

### Parameters
This endpoint does not have any parameters.


### Return type

**Array<string>**

### Authorization

[cookieAuth](../README.md#cookieAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | Array of friend usernames |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **locationPost**
> Array<LocationUser> locationPost(location)


### Example

```typescript
import {
    DefaultApi,
    Configuration,
    Location
} from './api';

const configuration = new Configuration();
const apiInstance = new DefaultApi(configuration);

let location: Location; //

const { status, data } = await apiInstance.locationPost(
    location
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **location** | **Location**|  | |


### Return type

**Array<LocationUser>**

### Authorization

[cookieAuth](../README.md#cookieAuth)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | Array of recent location entries for the supplied friends |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **loginPost**
> LoginResponse loginPost(loginRequest)


### Example

```typescript
import {
    DefaultApi,
    Configuration,
    LoginRequest
} from './api';

const configuration = new Configuration();
const apiInstance = new DefaultApi(configuration);

let loginRequest: LoginRequest; //

const { status, data } = await apiInstance.loginPost(
    loginRequest
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **loginRequest** | **LoginRequest**|  | |


### Return type

**LoginResponse**

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | Login successful – session cookie set |  * Set-Cookie - Cleared session cookie <br>  |
|**401** | Invalid credentials |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **logoutPost**
> GenericSuccess logoutPost()


### Example

```typescript
import {
    DefaultApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new DefaultApi(configuration);

const { status, data } = await apiInstance.logoutPost();
```

### Parameters
This endpoint does not have any parameters.


### Return type

**GenericSuccess**

### Authorization

[cookieAuth](../README.md#cookieAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | Logout successful – session cookie cleared |  * Set-Cookie - Cleared session cookie <br>  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **signupPost**
> SignupResponse signupPost(signupRequest)


### Example

```typescript
import {
    DefaultApi,
    Configuration,
    SignupRequest
} from './api';

const configuration = new Configuration();
const apiInstance = new DefaultApi(configuration);

let signupRequest: SignupRequest; //

const { status, data } = await apiInstance.signupPost(
    signupRequest
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **signupRequest** | **SignupRequest**|  | |


### Return type

**SignupResponse**

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | Signup result |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)


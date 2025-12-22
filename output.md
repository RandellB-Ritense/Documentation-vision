Here’s the rewritten content as clear, practical user documentation:

---

### Log In to Valtimo (Test)

To access the Valtimo system, you will use a web browser to log in. The system offers two ways to log in:

1. **Microsoft Active Directory (AD) Ritense**
   Use your Microsoft account credentials to log in. This is the recommended method if your organization uses Microsoft accounts.

2. **Ritense**
   Use a direct username and password if you do not use Microsoft accounts.

#### Steps to Log In
1. Open a web browser and go to the Valtimo (test) login page.
2. Enter your username in the **Username** field.
3. Enter your password in the **Password** field.
4. Select one of the login options:
   - Click **Microsoft AD Ritense** to log in with your Microsoft account.
   - Click **Ritense** to log in with a direct username and password.
5. If you selected **Microsoft AD Ritense**, you will see a message: *"Redirecting, please wait."* The system will redirect you to the Microsoft login page.
6. On the Microsoft login page, select your account from the list or enter your Microsoft email address and password.
7. After successful authentication, you will be logged into Valtimo.

---

### Access the IKO Admin Platform

After logging in, you will be redirected to the IKO Admin platform. This platform is used to manage connectors and aggregated data profiles.

#### Navigate the IKO Admin Interface
The IKO Admin interface includes the following sections:

1. **Connectors**
   This section lists all available connectors. Each connector has a name and a reference. You can add new connectors or manage existing ones.

2. **Aggregated Data Profiles**
   This section allows you to create, edit, and manage aggregated data profiles. Profiles define how data is collected and processed from connectors.

---

### Manage Connectors

Connectors are used to integrate external data sources into the IKO platform. You can view and manage connectors from the **Connectors** page.

#### View Connectors
1. From the left sidebar, click **Connectors**.
2. A table will display all available connectors, including their names and references.
3. Each connector has an ellipsis (⋮) menu on the right for additional actions, such as editing or deleting.

#### Add a New Connector
If you need to add a new connector, click the **Add connector** button. Follow the prompts to configure the connector.

---

### Manage Aggregated Data Profiles

Aggregated data profiles define how data from connectors is processed and stored. You can create, edit, and delete profiles in the **Aggregated Data Profiles** section.

#### View Aggregated Data Profiles
1. From the left sidebar, click **Aggregated Data Profiles**.
2. A table will display all existing profiles. If no profiles exist, the table will be empty.

#### Add a New Aggregated Data Profile
1. Click the **Add new 'Aggregated Data Profile'** button.
2. Enter a name for the profile in the **Name** field.
3. Select a connector instance from the **Select a connector instance** dropdown menu.
4. Select a connector endpoint from the **Select a connector endpoint** dropdown menu.
5. Specify the roles that can access this profile in the **Role** field (e.g., `ROLE_ADMIN, ROLE_USER`).
6. Configure cache settings:
   - Toggle **Cache enabled** to **On** or **Off**.
   - If enabled, set the **Time to live** (in milliseconds) for how long the data should be cached.
7. In the **Transform** field, enter a valid JQ expression to transform the data. For guidance on JQ expressions, visit [jq tutorial](https://jqlang.org/tutorial/).
8. Click **Save** to create the profile.

#### Edit an Aggregated Data Profile
1. From the **Aggregated Data Profiles** table, click the name of the profile you want to edit.
2. The **General** tab will open, displaying the current configuration.
3. Update any fields as needed, such as the name, connector instance, endpoint, roles, or cache settings.
4. Click **Save** to apply your changes.

#### Configure Profile Relations
1. Navigate to the **Relations** tab of the profile you are editing.
2. Under **Profile root**, click **Add child** to create a new relation.
3. Configure the relation:
   - Select the source from the **From** dropdown menu (e.g., "Profile root").
   - Select a connector instance from the **Connector Instance** dropdown menu.
   - Select a connector endpoint from the **Connector Endpoint** dropdown menu.
   - In the **Endpoint Parameter Mapping** field, define any parameters required for the endpoint (e.g., `{}` for none).
   - Enter a **Property Name** (e.g., "relation").
   - In the **Transform** field, enter a JQ expression to transform the data.
4. Click **Save** to add the relation.

#### Clear Cache for a Profile
If you have enabled caching for a profile, you can clear the cache manually:
1. Open the profile you want to edit.
2. In the **General** tab, click the **Clear cache** button.
3. The cached data for this profile will be cleared immediately.

---

### Save and Apply Changes
After making any changes to a profile or its relations, always click the **Save** button to apply your updates. If you navigate away without saving, your changes will be lost.

---
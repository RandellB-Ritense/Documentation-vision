# Accessing and Configuring Aggregated Data Profiles

## Logging In

To begin, access the login page for Valtimo (test). You will see fields for your username and password, along with two login options: "Microsoft AD Ritense" and "Ritense". If you need to reset your password, use the "Forgot Password?" link.

Select the "Microsoft AD Ritense" option and click on it. You will be redirected to a Microsoft login page where you can choose your account. Select the appropriate account and proceed.

## Navigating to Aggregated Data Profiles

After logging in, you will be redirected to the IKO Admin platform. From the menu, navigate to the "Aggregated Data Profiles" section. This section lists all the aggregated data profiles available in the system.

## Selecting a Data Profile

From the list of aggregated data profiles, select the "demo" profile. This will take you to the edit page for the "demo" profile, where you can configure various settings.

## Configuring Cache Settings

On the edit page, you will see several tabs, including "General," "Relations," and "Preview." By default, the "General" tab is selected.

To enable caching for the data profile, locate the "Cache enabled" toggle and click on it to turn it on. This will enable caching for the profile.

Next, set the cache duration by adjusting the "Time to live" field. You can decrease the value by clicking the minus button or increase it by clicking the plus button. This allows you to control how long the data is cached before it needs to be refreshed.

## Adding Relations

To add a relation to the data profile, navigate to the "Relations" tab. Here, you can add child relations to the profile root. Click the "Add child" button to open a form for adding a new relation.

In the form, you can specify the connector instance, connector endpoint, endpoint parameter mapping, property name, and transform. After filling in the necessary details, you can save the relation.

## Saving Changes

After configuring the cache settings and adding relations, click the "Save" button to save your changes. This will ensure that your configurations are applied to the data profile.

By following these steps, you can effectively manage and configure aggregated data profiles, enabling caching and adding relations as needed. This process is applicable to all aggregated data profiles and their relations, allowing for flexible and efficient data management.
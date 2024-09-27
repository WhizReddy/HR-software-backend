HOW TO SECURE YOUR ROUTES?
If you want to give a specific access to a route you add the Roles() decorator with one of the types of roles found on the Role() enum, ex:
Roles(Role.ADMIN)
If you want to make the route public for everyone to access you add the Public() decorator
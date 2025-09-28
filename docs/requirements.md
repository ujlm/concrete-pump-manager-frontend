Requirements
Complete web app to plan and manage a concrete pump service.
Merging of https://baleine.be/peeters/index.php?date=15/9/2025&def=1 with https://app.sopump.fr/auth/login 

We’re merging 2 older applications. The functionality should be as stated here, but the styling can be more sleek and modern.

The web app is meant to be displayed on large screens, but should be responsive for quick checks and edits on tablets or smartphones.
Page: /planning

1.	Calendar view to put in appointments.
2.	There is a difference with planned appointments and appointments that are assigned to a pump driver.
a.	There should be 3 possible calendar views, each view has the drivers in the columns, the hours in the rows
i.	Planned appointments only: 
ii.	Assigned appointments
iii.	Split view: planned appointments at the top, assigned appointments in the bottom calendar (the columns align) so that you can compare the planned vs assigned appointments per driver
3.	Each appointment has certain data fields:
a.	Vertrektijd (vanuit centrale): gets calculated automatically using Waze SDK based on 90 km/h max. speed and time of day (after filling in begintijd and address)
b.	Begintijd job: easy to set by user
c.	Eindtijd job: easy to set by user
d.	Type pomp: select from searchable dropdown list, which can be managed on a separate page (add/remove/edit pumps)
e.	Type pomp gevraagd: can be different or same as type pomp
f.	driver: searchable dropdown, drivers should be editable in a separate page
g.	Klant: searchable dropdown, editable on separate page
h.	Prijslijst: searchable dropdown, manageable on separate page
i.	Adres: Google maps API integration with autocomplete
j.	Werf: can be same as address or different
k.	Telefoonnummer (optional)
l.	Leverancier beton: searchable dropdown, manageable on separate page
m.	Betoncentrale: searchable dropdown, manageable on separate page
n.	Verwacht volume: int in m3
o.	Aantal meter leidingen: int in m2
p.	Type bouwwerk: fixed searchable dropdown with hardcoded values like “Chape” and “Funderingen”
q.	Eigen notities dispatcher: free text with private notes for dispatcher
r.	Extra info voor driver: free text with private notes visible to driver
s.	Status: te plannen (default), gepland (standaard), gepland eigen beton, geannuleerd
t.	CreatedAt and updatedAt (set automatically)
Calendar view: Planned appointments (voorlopige planning)
Grey: job was assigned to definitive planning
Green: job was cancelled
 

It’s important that the times are in the rows, and the drivers in the columns.
There should be easy navigation between different days, with the next 10 workdays clickable, and a date picker as alternative way to switch between days.
There should also be a button “Ga naar vandaag”
Very important: the calendar should give a complete overview of all the appointments for a day.
Indicate travel time differently from 
Allow overlap of appointments, but put a clear warning their, and always ask for confirmation if a certain action would cause overlap.

Calendar view: Split view Assigned appointments (top; definitieve planning) with Planned appointments bottom
Greyed out means: the planned appointment has been assigned.
 

How this works:
•	Double click or drag on empty space: add new appointment (like on Google Calendar)
•	Click on appointment: selects it. A selected appointment can be put somewhere else by clicking in a free time window. It can be put:
o	For the same driver at a different time range (same column, different rows)
o	For another driver at the same or different time (different column, same or different rows)
o	From the planned appointments to assigned appointments (which greys out the planned appointment, indicating this has been made definitive)

There is one column per driver. Drivers can be managed in admin/users.

When adding an appointment or when planning it in, there should be a popup prompting to notify the driver: it will send a WhatsApp message with all the info nicely formatted to the driver, including a link with the address, which opens Waze when tapped.

Job detail view: overview
Per job te tracken (optioneel): werkelijk gepompt volume, werkelijke start en eindtijd, werkelijke leiding  om de uiteindelijke factuur te genereren

 

Job detail view: invoicing
Line items filled in according to job data, but editable if needed.
Tax calculation (default 0%)
Prices can be managed in admin/prices
 

Page: admin/clients
 

Editable table with data fields:
•	Klantcode: int (unique id)
•	Naam van klant: string
•	Prijslijst: LINK to prijslijst
•	Leverancier beton: boolean
•	Tel.nr: phone number
•	Adres link: address (linked to google maps)
•	Adding an address typically via Google Maps and this fills in the following fields:
•	Adres: street and number
•	Postcode: postal code (int; 4 numbers)
•	City: string
•	Country: Belgium
•	CreatedAt and updatedAt (set automatically)

Page: admin/concrete-plants
 

Editable table with data fields:
•	Naam betoncentrale: string
•	ID
•	Klant: LINK to client
•	Adres link: address (linked to google maps)
•	Adding an address typically via Google Maps and this fills in the following fields:
•	Adres: street and number
•	Postcode: postal code (int; 4 numbers)
•	City: string
•	Country: Belgium
•	CreatedAt and updatedAt (set automatically)



Page: admin/yards

 

Fields:
•	Id
•	Naam van werf: string + unique
•	Naam van klant: LINK to client
•	Werfcontact: string
•	Adres link: address (linked to google maps)
•	Adding an address typically via Google Maps and this fills in the following fields:
•	Adres: street and number
•	Postcode: postal code (int; 4 numbers)
•	City: string
•	Country: Belgium
•	Telnr: optional
•	Email: optional
•	CreatedAt and updatedAt (set automatically)


Page: admin/prices
 
Fields:
•	Id
•	Naam Prijs: string + unique
•	Actief: Boolean
•	Cementmelk prijs: Float (price)
•	Tarief centrale reiniging: Float (price)
•	Verhoging tarieven weekend: Int (in percent, so eg value of 50 means 50% price increase in weekends)
•	Zak cement prijs: Float (price)
•	Tweede driver tarief: Float (price)
•	Lengte slangen vanaf toevoeging 2e driver: Float (meter)
•	CreatedAt and updatedAt (set automatically)

Page: admin/users

 

Fields:
•	userId
•	Voornaam: string
•	Achternaam: string
•	Actief: Boolean
•	Email: string (optional)
•	Telefoonnr: string (optional)
•	Role: select one or more from “driver”, “Manager”, “Dispatcher”, “Accountant”
•	CreatedAt and updatedAt (set automatically)

Page: admin/machines


 

Fields:
•	Id
•	Naam: string (unique)
•	Machinecode: string
•	driver: LINK to user with role “driver”
•	Pompbonmodel: LINK to invoice
•	Active: Boolean
•	Nummerplaat: string in the form X-XXX-XXX
•	Type: “Pomp” or “Mixer”
•	Categorie: “Pomp leiden”, “Pomp 32”, or “Pomp 36”
•	CreatedAt and updatedAt (set automatically)


Page: admin/invoicing
 

Invoice templating functionality: define which fields should be in the invoice, and connect them to data fields and prices.
These invoice templates can get created and edited and then be used to create invoices with a click of a button after completion of the job.
Page: /dashboard
Reporting in customizable date range.
Overview with tables and visualization of the following data:
•	Gross revenue per client per workday, with totals
•	Number of jobs per driver per workday, with totals
•	Volume per pump per workday, with totals
•	Pivot table of number of annulations per client per workday, with clients
All reports should be exportable to Excel.
In general, all tables and data should be exportable to Excel at any time and for any time range.

Permissions and access
•	User with role “driver” can only view their own schedule
•	Other users for now have full read/write access
•	Only the “Manager” can add/edit users
Future features:
•	Track job status with buttons in WhatsApp which prompt the driver to indicate when a stage is done
 
•	Track location of pump, speed and how it’s currently used
•	Integrations with accounting software like Yuki

Other info
NextJS latest (15.5.3) App Router with 

Supabase:
•	Auth
•	Database: all fields should be in English, keep track of the translations of the columns to Dutch in a next-intl json file
•	Edge functions for WhatsApp integration

Styling: 
•	Tailwind V4 Tailwind V4: https://tailwindcss.com/docs/installation/framework-guides/nextjs
•	Shadcn https://ui.shadcn.com/docs/installation/next 
Integrations: 
•	WhatsApp to communicate schedules with driveren
•	Google Maps to easily input and verify addresses
•	Waze to derive realistic driving times based on hour and max. speed of truck

Packages:
•	Data visualization: Chart.js
•	Internationalization: next-intl
•	Excel export: xlsx


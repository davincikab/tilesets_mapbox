## Working with 3D Tiles and Custom 3d Models
- Download the building for the area of interest from OSM data using QuickOSM in QGIS or from overpass API
- Use QGIS to clean the data i.e delete some attribute data
- Edit/Delete the building feature that are are not necessary
- Upload the data to mapbox tileset 
- Use the vector to create building extrusion

### Create tileset
```javascript
    map.addSource('building',{
        type:'vector',
        url:'mapbox://daudi97.0unvzrfj'
    });

    map.addLayer({
        'id':'3d_building'
        'source':'building',
        'source-layer':'my_building-5r7lsr',
        'type':'fill-extrusion',
        'min-zoom':14,
        'paint':{
            'fill-extrusion-color': '#FCF5E8',
            'fill-extrusion-height': ["number", ["get", "height"], 5],
            'fill-extrusion-base': ["number", ["get", "min_height"], 0],
            'fill-extrusion-opacity': 1
        }
    })
```

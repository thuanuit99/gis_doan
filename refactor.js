const nextButton = document.getElementById('next');
const searchBtn = document.querySelector('#search');
const previousButton = document.getElementById('previous');
const loading = document.getElementById('loading');
const contentDiv = document.getElementById('content');
const datePicker = document.getElementById('datePicker')
const modalButton = document.getElementById('detail');
const modalContent = document.getElementById('modal-content');
let view;


function initializeMap() {
    require([
        "esri/Map",
        "esri/views/MapView",
        "esri/Graphic",
        "esri/geometry/Polyline",
        "esri/symbols/SimpleLineSymbol",
        "esri/Color",
        "esri/geometry/Point"
    ], function (Map, MapView, Graphic, Polyline, SimpleLineSymbol, Color, Point) {
        const map = new Map({
            basemap: "streets-navigation-vector"
        });

        view = new MapView({
            container: "viewDiv",
            map: map,
            center: [106.859718, 10.9199],
            zoom: 12.5
        });
    });
}
const updateMapWithPolyline = (view, polylineCoordinates) => {
    require(["esri/Graphic"], function (Graphic) {
        const polyline = {
            type: "polyline", // autocasts as new Polyline()
            paths: polylineCoordinates
        };

        const polylineSymbol = {
            type: "simple-line", // autocasts as new SimpleLineSymbol()
            color: [24, 123, 205], // Orange
            width: 4
        };

        const polylineGraphic = new Graphic({
            geometry: polyline,
            symbol: polylineSymbol
        });

        view.graphics.removeAll(); // Clear previous graphics
        view.graphics.add(polylineGraphic); // Add new polyline
    });


}



searchBtn.onclick = async function (event) {

    let currentIndex = 0;
    event.preventDefault()
    const vehicleChoosen = document.querySelector('#xe').value;
    const dateChoosen = document.querySelector('#datePicker').value;
    try {
        const response = await fetch(`${vehicleChoosen}.json`);

        loading.classList.add('d-flex')
        loading.classList.add('justify-content-center')
        if (!response.ok) {
            throw new Error('Mạng không phản hồi thành công');
        }
        const data = await response.json(); // Parse the JSON into JavaScript objects
        const vehicleInfor = data.vehicle;
        const dataRoute = data['data'];
        dataRouteByDateChoosen = dataRoute.filter((item) => {
            return item['date'] == dateChoosen
        })
        if (!dataRouteByDateChoosen.length || !dataRouteByDateChoosen[0]['records']) {
            contentDiv.innerHTML = `<h5>Xe ${vehicleInfor['name']} không chạy vào ngày ${dateChoosen}</h5>`;
            return; // Kết thúc nếu không có records
        }
        const polylineCoordinates = dataRouteByDateChoosen[0]['records'].map((point) => {
            return [parseFloat(point.Long), parseFloat(point.Lat)];

        })
        console.log(dataRouteByDateChoosen)
        const trafficJamData = dataRouteByDateChoosen[0]['records'].filter((point) => {
            return point['Vận tốc'] <= 10 && point['Trạng thái xe'] == 'Xe chạy bình thường' && point['Vận tốc'] > 0
        })
        const trafficBusyData = dataRouteByDateChoosen[0]['records'].filter((point) => {
            return point['Vận tốc'] <= 20 && point['Vận tốc'] >= 10 && point['Trạng thái xe'] == 'Xe chạy bình thường' && point['Vận tốc'] > 0
        })
        const trafficJamPoint = trafficJamData.map((point) => {
            return [parseFloat(point.Long), parseFloat(point.Lat)];

        })
        const trafficBusyPoint = trafficBusyData.map((point) => {
            return [parseFloat(point.Long), parseFloat(point.Lat)];

        })

        renderContent(dataRouteByDateChoosen[0]['records'])
        updateMapWithPolyline(view, polylineCoordinates)
        updateMapWithStartPoint(view, polylineCoordinates, dataRouteByDateChoosen[0]['records'])
        updateMapWithEndPoint(view, polylineCoordinates, dataRouteByDateChoosen[0]['records'])
        showRecentLocation(view, polylineCoordinates, currentIndex, dataRouteByDateChoosen[0]['records'], vehicleInfor)
        updateBusyPoint(view, trafficBusyPoint)
        updateTrafficJamPoint(view, trafficJamPoint)

        nextButton.onclick = function () {
            currentIndex++;
            renderContent(dataRouteByDateChoosen[0]['records'], currentIndex);
            showRecentLocation(view, polylineCoordinates, currentIndex, dataRouteByDateChoosen[0]['records'], vehicleInfor)
        }
        previousButton.onclick = () => {
            if (currentIndex >= 1) {
                currentIndex--;
                renderContent(dataRouteByDateChoosen[0]['records'], currentIndex);
                showRecentLocation(view, polylineCoordinates, currentIndex, dataRouteByDateChoosen[0]['records'], vehicleInfor)
            }

        }
        modalButton.onclick = () => {
            this.setAttribute("data-target", "#myModal");
            const trafficJamArray = trafficJamData.map((point) => {
                return `<li>${point['Địa chỉ']}</li>`
            })
            const first10Items = trafficJamArray.slice(0, 10).join('');
            const remainingItems = trafficJamArray.slice(10).join('');

            modalContent.innerHTML = `<ul id="trafficJamList">${first10Items}</ul>`;

            if (trafficJamArray.length > 10) {
                modalContent.innerHTML += `<button id="viewMoreButton" class='btn btn-primary'>Xem thêm</button>`;
            }

            const viewMoreButton = document.getElementById("viewMoreButton");
            viewMoreButton.onclick = () => {

                document.getElementById("trafficJamList").innerHTML += remainingItems;

                viewMoreButton.style.display = 'none';
            };
        }


    } catch (error) {
        console.error('Lỗi khi tải file JSON:', error);
    }
}



function renderContent(dataContent, currentIndex = 0) {

    contentDiv.innerHTML = `
        <ul>
            <li><b>Thời điểm: </b>${dataContent[currentIndex]['Thời điểm']}</li>
            <li><b>Tốc độ: </b>${dataContent[currentIndex]['Vận tốc']} km/h</li>
            <li><b>GPS: </b>${dataContent[currentIndex]['GPS']}</li>
            <li><b>Điện áp bình: </b>${dataContent[currentIndex]['Điện áp bình']}</li>
            <li><b>Nhiên liệu: </b>${dataContent[currentIndex]['Nhiên liệu']}</li>
            <li><b>Trạng thái cửa: </b>${dataContent[currentIndex]['Trạng thái cửa']}</li>
            <li><b>Trạng thái máy: </b>${dataContent[currentIndex]['Trạng thái máy']}</li>
            <li><b>Trạng thái xe: </b>${dataContent[currentIndex]['Trạng thái xe']}</li>
            <li><b>Tọa độ: </b>${dataContent[currentIndex]['Tọa độ']}</li>
            <li><b>Địa chỉ: </b>${dataContent[currentIndex]['Địa chỉ']}</li>
        </ul>
    `;
}
function updateMapWithStartPoint(view, pointCoordinates, data) {

    require(["esri/Graphic", "esri/geometry/Point", "esri/symbols/PictureMarkerSymbol"], function (Graphic, Point, PictureMarkerSymbol) {
        const startaddress = data.filter((item) => {
            return item['Lat'] == pointCoordinates[0][1];
        })

        const startPoint = new Point({
            longitude: pointCoordinates[0][0],
            latitude: pointCoordinates[0][1]
        });
        const pointSymbol = new PictureMarkerSymbol({
            url: "start.png", // URL to the house icon image
            width: "36px",
            height: "36px"
        });

        const startpopupTemplate = {
            title: `Điểm bắt Đầu`,
            content: `<strong>Tọa độ: </strong>${startPoint.latitude},${startPoint.longitude} <br><strong> Địa chỉ: </strong>${startaddress[0]['Địa chỉ']}`

        };


        const startpointGraphic = new Graphic({
            geometry: startPoint,
            symbol: pointSymbol,
            popupTemplate: startpopupTemplate
        });


        view.graphics.add(startpointGraphic);
    });

}
function updateMapWithEndPoint(view, pointCoordinates, data) {

    require(["esri/Graphic", "esri/geometry/Point", "esri/symbols/PictureMarkerSymbol"], function (Graphic, Point, PictureMarkerSymbol) {
        const endAdress = data.filter((item) => {
            return item['Lat'] == pointCoordinates[pointCoordinates.length - 1][1];
        })

        const endPoint = new Point({
            longitude: pointCoordinates[pointCoordinates.length - 1][0],
            latitude: pointCoordinates[pointCoordinates.length - 1][1]
        });
        const pointSymbol = new PictureMarkerSymbol({
            url: "end.png", // URL to the house icon image
            width: "50px",
            height: "50px"
        });

        const endpopupTemplate = {
            title: `Điểm Kết thúc`,
            content: `<strong>Tọa độ: </strong>${endPoint.latitude},${endPoint.longitude} <br><strong> Địa chỉ: </strong>${endAdress[0]['Địa chỉ']}`

        };


        const endpointGraphic = new Graphic({
            geometry: endPoint,
            symbol: pointSymbol,
            popupTemplate: endpopupTemplate
        });


        view.graphics.add(endpointGraphic);
    });

}
function showRecentLocation(view, pointCoordinates, currentIndex, data, vehicleInfor) {

    require(["esri/Graphic", "esri/geometry/Point", "esri/symbols/SimpleMarkerSymbol"], function (Graphic, Point, SimpleMarkerSymbol) {
        const startaddress = data.filter((item) => {
            return item['Lat'] == pointCoordinates[currentIndex][1];
        })
        view.graphics.items.forEach(graphic => {
            if (graphic.attributes && graphic.attributes.type === "movingPoint") {
                view.graphics.remove(graphic);
            }
        });
        let angle = 0;
        if (currentIndex < pointCoordinates.length - 1) {
            const nextPoint = pointCoordinates[currentIndex + 1];
            const deltaY = nextPoint[1] - pointCoordinates[currentIndex][1];
            const deltaX = nextPoint[0] - pointCoordinates[currentIndex][0];
            angle = Math.atan2(deltaY, deltaX) * (180 / Math.PI);
        }
        const startPoint = new Point({
            longitude: pointCoordinates[currentIndex][0],
            latitude: pointCoordinates[currentIndex][1]
        });
        const pointSymbol = new SimpleMarkerSymbol({
            style: "circle",
            color: "orange",
            size: "20px",
            angle: angle
        });

        const startpopupTemplate = {
            title: `Thông tin chi tiết`,
            content: `
        <div class="container text-body">
            <div class="row mb-2">
                <div class="col-6 font-weight-bold">Biển số xe:</div>
                <div class="col-6">${vehicleInfor['name']}</div>
            </div>
            <div class="row mb-2">
                <div class="col-6 font-weight-bold">Trọng tải xe:</div>
                <div class="col-6">${vehicleInfor['weight']}</div>
            </div>
            <div class="row mb-2">
                <div class="col-6 font-weight-bold">Tọa độ:</div>
                <div class="col-6">${startPoint.latitude}, ${startPoint.longitude}</div>
            </div>
            <div class="row mb-2">
                <div class="col-6 font-weight-bold">Địa chỉ:</div>
                <div class="col-6">${startaddress[0]['Địa chỉ']}</div>
            </div>
        </div>
    `

        };


        const startpointGraphic = new Graphic({
            geometry: startPoint,
            symbol: pointSymbol,
            popupTemplate: startpopupTemplate,
            attributes: {
                type: "movingPoint"
            }
        });


        view.graphics.add(startpointGraphic);
    });


}



function updateTrafficJamPoint(view, trafficJamPoint) {

    require(["esri/Graphic", "esri/geometry/Point", "esri/symbols/SimpleMarkerSymbol"], function (Graphic, Point, SimpleMarkerSymbol) {
        trafficJamPoint.forEach((point) => {
            let trafficJamPoint = new Point({
                longitude: point[0],
                latitude: point[1]
            });
            const trafficJamSymbol = new SimpleMarkerSymbol({
                style: "circle",
                color: "red",
                size: "8px",
                outline: { // Loại bỏ viền
                    color: null, // Không có màu viền
                    width: 0 // Kích thước viền là 0
                }
            });



            const startpointGraphic = new Graphic({
                geometry: trafficJamPoint,
                symbol: trafficJamSymbol,
            });


            view.graphics.add(startpointGraphic);
        })


    });

}

function updateBusyPoint(view, trafficJamPoint) {

    require(["esri/Graphic", "esri/geometry/Point", "esri/symbols/SimpleMarkerSymbol"], function (Graphic, Point, SimpleMarkerSymbol) {
        trafficJamPoint.forEach((point) => {
            let trafficJamPoint = new Point({
                longitude: point[0],
                latitude: point[1]
            });
            const trafficJamSymbol = new SimpleMarkerSymbol({
                style: "circle",
                color: "yellow",
                size: "8px",
                outline: { // Loại bỏ viền
                    color: null, // Không có màu viền
                    width: 0 // Kích thước viền là 0
                }
            });



            const startpointGraphic = new Graphic({
                geometry: trafficJamPoint,
                symbol: trafficJamSymbol,
            });


            view.graphics.add(startpointGraphic);
        })


    });

}




initializeMap();



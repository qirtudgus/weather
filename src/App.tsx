
import axios from 'axios';
import { useEffect ,useState} from 'react';
import './App.css';
import readXlsxFile from 'read-excel-file';
import { NumericLiteral } from 'typescript';


    //<!--
    //
    // LCC DFS 좌표변환을 위한 기초 자료
    //
    var RE = 6371.00877; // 지구 반경(km)
    var GRID = 5.0; // 격자 간격(km)
    var SLAT1 = 30.0; // 투영 위도1(degree)
    var SLAT2 = 60.0; // 투영 위도2(degree)
    var OLON = 126.0; // 기준점 경도(degree)
    var OLAT = 38.0; // 기준점 위도(degree)
    var XO = 43; // 기준점 X좌표(GRID)
    var YO = 136; // 기1준점 Y좌표(GRID)
    //
    // LCC DFS 좌표변환 ( code : "toXY"(위경도->좌표, v1:위도, v2:경도), "toLL"(좌표->위경도,v1:x, v2:y) )
    //

    const rs = dfs_xy_conv('toXY',37.6016, 127.0114)

    console.log(rs.lat, rs.lng, rs.x, rs.y);

    //https://gist.github.com/fronteer-kr/14d7f779d52a21ac2f16
    function dfs_xy_conv(code :any, v1:any, v2:any) {
        var DEGRAD = Math.PI / 180.0;
        var RADDEG = 180.0 / Math.PI;

        var re = RE / GRID;
        var slat1 = SLAT1 * DEGRAD;
        var slat2 = SLAT2 * DEGRAD;
        var olon = OLON * DEGRAD;
        var olat = OLAT * DEGRAD;

        var sn = Math.tan(Math.PI * 0.25 + slat2 * 0.5) / Math.tan(Math.PI * 0.25 + slat1 * 0.5);
        sn = Math.log(Math.cos(slat1) / Math.cos(slat2)) / Math.log(sn);
        var sf = Math.tan(Math.PI * 0.25 + slat1 * 0.5);
        sf = Math.pow(sf, sn) * Math.cos(slat1) / sn;
        var ro = Math.tan(Math.PI * 0.25 + olat * 0.5);
        ro = re * sf / Math.pow(ro, sn);
        var rs:any = {};
        if (code == "toXY") {
            rs['lat'] = v1;
            rs['lng'] = v2;
            var ra = Math.tan(Math.PI * 0.25 + (v1) * DEGRAD * 0.5);
            ra = re * sf / Math.pow(ra, sn);
            var theta = v2 * DEGRAD - olon;
            if (theta > Math.PI) theta -= 2.0 * Math.PI;
            if (theta < -Math.PI) theta += 2.0 * Math.PI;
            theta *= sn;
            rs['x'] = Math.floor(ra * Math.sin(theta) + XO + 0.5);
            rs['y'] = Math.floor(ro - ra * Math.cos(theta) + YO + 0.5);
        }
        else {
            rs['x'] = v1;
            rs['y'] = v2;
            var xn = v1 - XO;
            var yn = ro - v2 + YO;
            ra = Math.sqrt(xn * xn + yn * yn);
            if (sn < 0.0) {ra =- ra;}
            var alat = Math.pow((re * sf / ra), (1.0 / sn));
            alat = 2.0 * Math.atan(alat) - Math.PI * 0.5;

            if (Math.abs(xn) <= 0.0) {
                theta = 0.0;
            }
            else {
                if (Math.abs(yn) <= 0.0) {
                    theta = Math.PI * 0.5;
                    if (xn < 0.0){theta =- theta;}
                }
                else theta = Math.atan2(xn, yn);
            }
            var alon = theta / sn + olon;
            rs['lat'] = alat * RADDEG;
            rs['lng'] = alon * RADDEG;
        }
        return rs;
    }

    let nx:number = 0;
    let ny:number = 0;





function App() {

  //기상청에서 받아온 오늘 날씨 00:00~23:00 시간단위
  let tempList :any [] = [];
  
  //당일날씨 00시 ~ 23시
  const [dailyTemp, setDailyTemp] : any[] = useState([]);


  //현재위치
  const [position,setPosition] = useState('');
  //현재온도
  const [temp, setTemp] = useState('');
  
    //최저온도
    const [lowTemp, setLowTemp] = useState('');
  //최고온도
  const [highTemp, setHighTemp] = useState('');

  //openWeather key
  const openWeatherApiKey :(string | undefined) = process.env.REACT_APP_openWeatherApiKey;
  //kakao REST key
  const REST_API_KEY :(string | undefined) =  process.env.REACT_APP_REST_API_KEY
  //기상청 active key
  const PUBLICK_API_KEY :(string | undefined) = process.env.REACT_APP_PUBLICK_API_KEY;

  //openWeahterApi로 현재 날씨
 const openWeatherApiCurrent = (lat :number,lon :number)  =>  {
  return axios.get(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${openWeatherApiKey}&lang=kr&units=metric`).then(res=>{
    // console.log(res.data)
    //  const currentLocationCity :string = res.data[0].name;
     return res.data
   })
 }

 const openWeatherApiForecast = (lat :number, lon:number ) => {
  return axios.get(`https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${openWeatherApiKey}&lang=kr&units=metric`).then(res=>{
    // console.log(res.data)
    //  const currentLocationCity :string = res.data[0].name;
     return res.data
   })
 }

 
 //카카오 좌표계 변환하기 api
 //위도 경도 값으로 현재 주소를 반환한다.
 const kakaoApi = (lat :number,lon :number) => {
   return axios.get(`https://dapi.kakao.com/v2/local/geo/coord2address.json?x=${lon}&y=${lat}&input_coord=WGS84`,{headers:{
    Authorization: `KakaoAK ${REST_API_KEY}`
   }}).then(res => {
     const si = res.data.documents[0].address.region_1depth_name;
     const gu = res.data.documents[0].address.region_2depth_name;
     const dong = res.data.documents[0].address.region_3depth_name;
     console.log(res)
    // console.log(si,gu,dong) // 서울 성북구 정릉동
    return dong
   })
 }


// watchID 성공 시 실행되는 함수
async function getCurrentCity(position :any) {
  const latitude = (position.coords.latitude)
  const longitude = (position.coords.longitude)
  const rs = dfs_xy_conv('toXY',latitude,longitude);

  console.log("와치id 경도값")
  console.log(rs.x,rs.y)

  getWeatherApi2(rs.x,rs.y)

  const currentLocationCity2 = await openWeatherApiCurrent(latitude,longitude);
  const currentLocationForecast = await openWeatherApiForecast(latitude,longitude);
  const kakaoCity = await kakaoApi(latitude,longitude);
  console.log(currentLocationCity2)
  console.log(currentLocationForecast)
  console.log(`현재 온도는 ${currentLocationCity2.main.temp}도 입니다.`)
  console.log(`현재 위치는 ${kakaoCity}입니다.`)
  setPosition(`현재 위치는 ${kakaoCity}입니다.`)
  setTemp(`현재 온도는 ${currentLocationCity2.main.temp}도 입니다.`)
}

// watchID 실패 시 실행되는 함수
function error() {
  alert('Sorry, no position available.');
}

// watchID 옵션
// https://7942yongdae.tistory.com/150
const options = {
  enableHighAccuracy: true,
  maximumAge: 0,
  timeout: Infinity
};

// 위도, 경도 값을 구하는 자바스크립트 api
const watchID  = (): void => {navigator.geolocation.getCurrentPosition(getCurrentCity, error, options)};

useEffect(()=>{

},[])


  //하루전날의 Date 생성 오늘이 5월15일이면 5월 14일 생성
  //기상청 데이터를 받아올 때 사용한다.
const today = new Date();
const year = today.getFullYear();
const month = today.getMonth()+1;
const day = today.getDate()-1;
const formatDate = year+(("00"+month.toString()).slice(-2))+(("00"+day.toString()).slice(-2));
console.log(formatDate)


  //기상청 초단기예보조회에 필요한 쿼리스트링 변수들
  //프록시는 로컬환경 개발을 위해 사용함 //https://cors-anywhere.herokuapp.com/corsdemo에서 활성화 시켜줘야 프록시 활성화됨
  const proxy :string = 'https://cors-anywhere.herokuapp.com/'
  const apiKey :(string|undefined) = PUBLICK_API_KEY;
  const pageNo :number = 1;
  const numOfRows :number =290;
  const dataType :string = 'JSON';
  const base_date :string = formatDate
  const base_time :string = '2330';


 //


  // http://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getVilageFcst
  
  const  getWeatherApi2 = async (nx:number,ny:number) => {
    try{
   await axios.get(`${proxy}http://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getVilageFcst?serviceKey=${apiKey}&pageNo=${pageNo}&numOfRows=${numOfRows}&dataType=${dataType}&base_date=${base_date}&base_time=${base_time}&nx=${nx}&ny=${ny}`)
    .then(res => {
      console.log(res.data)
      //배열 290개
      tempList = [res.data.response.body.items.item]
      
      console.log(tempList)
     
      
      // 시간별 온도가 담긴 TMP 값만 빼오기
      let tmpList = tempList[0].filter((i :any,index :any) =>  i.category === 'TMP')
      // let tmpList = tempList.map(a => ( a.category == 'TMP'))
      console.log(tmpList)

      // 00시 ~ 23시까지의 온도값 배열
      let timeList = tmpList.map((i:any) => (i.fcstValue))
      console.log('00시 ~ 23시까지의 온도값 배열')
      console.log(timeList)
      console.log(timeList[timeList.length -1])
      setDailyTemp([...timeList])

      let lowTemp = timeList.sort()[0];
      console.log('최저온도')
      console.log(lowTemp)
      setLowTemp(lowTemp)
      

      let highTemp = timeList.sort()[timeList.length -1];
      console.log('최고온도')
      console.log(highTemp)
      setHighTemp(highTemp)


    })
  }catch(err){
    console.log(err)
  }
  }



  return (
  <>
  {/* <button onClick={getWeatherApi2}>기상청 날씨 api</button> */}
  <button onClick ={()=> {watchID()}}>오픈웨더 날씨 api</button>
  <p>{position}</p>
  <p>{temp}</p>
  <p>최저온도 {lowTemp}</p>
  <p>최고온도 {highTemp}</p>
  {dailyTemp.map((i :any) => (<li>
    {i}
  </li>))}
  </> 
  );
}

export default App;

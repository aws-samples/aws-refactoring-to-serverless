function getRandomInt(min, max) {
    return min + Math.floor(Math.random() * (max-min));
}
  
export const handler = async(event) => {
    const response = {
        statusCode: 200,
        request_id: event.RequestId,
        body: 
        {
            SSN: event.SSN,
            score: getRandomInt(300, 900),
            history: getRandomInt(1,30)
        }
    };
    return response;
};

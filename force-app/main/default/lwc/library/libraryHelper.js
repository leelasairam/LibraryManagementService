export function getOverDueDays(returnDate) {
    const today = new Date();
    const otherDate = new Date(returnDate);

    today.setHours(0, 0, 0, 0);
    otherDate.setHours(0, 0, 0, 0);

    const differenceInMs = otherDate.getTime() - today.getTime();

    const msInADay = 1000 * 60 * 60 * 24;
    const daysDifference = Math.floor(differenceInMs / msInADay);
    if(daysDifference>=0){
        return 0;
    }
    else{
        return Number(daysDifference.toString().replace("-", ""));
    }
}
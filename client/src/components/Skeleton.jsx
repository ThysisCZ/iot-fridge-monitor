import { Skeleton } from "./ui/skeleton";
import { Card, CardContent, } from "./ui/card";

export function GatewaySkeleton() {
    return(
        <>
            <Card >
                <CardContent className="mt-2 flex flex-col items-start justify-between gap-2">
                    <Skeleton className="h-4 w-1/4" />
                    <Skeleton className="h-2 w-[40px]" />
                    <Skeleton className="mt-4 h-[80px] w-full" />
                </CardContent>
            </Card>
        </>
    )
}

export function ButtonSkeleton({ className }) {
    return(
        <Skeleton className={`mb-4 h-[41px] w-[164px] rounded-full ${className}`}/>
    )
}

export function FridgeSkeleton() {
    return(
        <>
            <Card >
                <CardContent className="mt-2 flex flex-col items-start justify-between gap-2">
                    <Skeleton className="h-4 w-1/4" />
                    <Skeleton className="h-2 w-[110px]" />
                    <Skeleton className="mt-4 h-[220px] w-full" />
                </CardContent>
            </Card>
        </>
    )
}
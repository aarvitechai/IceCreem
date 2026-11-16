"use client";

import { useEffect, useRef } from "react";
import { HubConnectionBuilder, LogLevel, type HubConnection } from "@microsoft/signalr";
import { useAppSelector } from "@/store/store";

export interface HubHandlers {
  onStatus?: (e: { orderNumber: string; status: string }) => void;
  onLocation?: (e: { orderNumber: string; latitude: number; longitude: number }) => void;
  onCreated?: (e: { orderNumber: string; total: number }) => void;
}

/**
 * Live order updates over SignalR.
 * Pass an order number to watch one order, or "admins" to watch every order (staff only).
 */
export function useOrderHub(target: string | null, handlers: HubHandlers) {
  const token = useAppSelector((s) => s.auth.accessToken);
  const handlersRef = useRef(handlers);

  useEffect(() => {
    handlersRef.current = handlers;
  });

  useEffect(() => {
    if (!target || (target === "admins" && !token)) return;

    const connection: HubConnection = new HubConnectionBuilder()
      .withUrl("/hubs/orders", { accessTokenFactory: () => token ?? "" })
      .withAutomaticReconnect()
      .configureLogging(LogLevel.Warning)
      .build();

    connection.on("OrderStatusChanged", (e) => handlersRef.current.onStatus?.(e));
    connection.on("LocationUpdated", (e) => handlersRef.current.onLocation?.(e));
    connection.on("OrderCreated", (e) => handlersRef.current.onCreated?.(e));

    const join = () =>
      target === "admins" ? connection.invoke("JoinAdmins") : connection.invoke("JoinOrder", target);
    connection.onreconnected(() => void join());

    let stopped = false;
    connection
      .start()
      .then(() => (stopped ? undefined : join()))
      .catch(() => undefined); // Live updates are a bonus. The page still works without them.

    return () => {
      stopped = true;
      void connection.stop();
    };
  }, [target, token]);
}

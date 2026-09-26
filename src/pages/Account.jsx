import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as userApi from "../api/user";
import * as ordersApi from "../api/orders";
import * as addressesApi from "../api/addresses";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { PageFade, Reveal } from "../components/Reveal";
import { StatusPill } from "../components/StatusPill";
import AddressForm from "../components/AddressForm";
import BackButton from "../components/BackButton";
import { formatDate, formatPrice } from "../utils/format";

const TABS = ["profile", "orders", "addresses"];

export default function Account() {
  const { logout, isAdmin } = useAuth();
  const { notify } = useToast();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = TABS.includes(searchParams.get("tab")) ? searchParams.get("tab") : "profile";

  const profile = useQuery({ queryKey: ["profile"], queryFn: userApi.getMe });
  const orders = useQuery({ queryKey: ["orders"], queryFn: ordersApi.getMyOrders, enabled: tab === "orders" });
  const addresses = useQuery({ queryKey: ["addresses"], queryFn: addressesApi.getAddresses, enabled: tab === "addresses" });

  const [form, setForm] = useState({ fullName: "", phone: "" });
  useEffect(() => {
    if (profile.data) setForm({ fullName: profile.data.fullName ?? "", phone: profile.data.phone ?? "" });
  }, [profile.data]);

  const updateProfile = useMutation({
    mutationFn: (data) => userApi.updateMe(data),
    onSuccess: (data) => {
      queryClient.setQueryData(["profile"], data);
      notify("Profile updated", "success");
    },
    onError: (err) => notify(err.message, "error"),
  });

  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState(null);
  const deleteAddress = useMutation({
    mutationFn: (id) => addressesApi.deleteAddress(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["addresses"] }),
  });
  const setDefault = useMutation({
    mutationFn: (id) => addressesApi.setDefaultAddress(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["addresses"] }),
  });

  return (
    <PageFade>
      <div className="mx-auto max-w-[1200px] px-5 py-12 md:px-10">
        <BackButton className="mb-6" />
        <h1 className="text-[clamp(1.9rem,3.6vw,2.8rem)]">Hello, {profile.data?.fullName?.split(" ")[0] ?? "there"}</h1>
        <div className="mt-10 grid gap-10 md:grid-cols-[200px_1fr]">
          <nav className="flex flex-wrap gap-4 border-b pb-4 md:flex-col md:border-b-0 md:border-r md:pb-0 md:pr-6">
            {TABS.map((t) => (
              <button
                key={t}
                onClick={() => setSearchParams({ tab: t })}
                className={`label-xs link-underline text-left capitalize ${tab === t ? "text-accent" : ""}`}
              >
                {t}
              </button>
            ))}
            <Link to="/wishlist" className="label-xs link-underline">
              Wishlist
            </Link>
            <Link to="/track-order" className="label-xs link-underline">
              Track order
            </Link>
            {isAdmin && (
              <Link to="/admin" className="label-xs link-underline">
                Admin console
              </Link>
            )}
            <button className="label-xs link-underline text-left" onClick={logout}>
              Sign out
            </button>
          </nav>

          <div>
            {tab === "profile" && (
              <Reveal>
                <div className="hairline-card max-w-md p-6">
                  <h2 className="text-xl">Profile</h2>
                  {profile.isLoading ? (
                    <div className="skeleton mt-6 h-32 w-full" />
                  ) : (
                    <form
                      className="mt-6 space-y-5"
                      onSubmit={(e) => {
                        e.preventDefault();
                        updateProfile.mutate(form);
                      }}
                    >
                      <div>
                        <p className="label-xs text-muted-foreground">Email</p>
                        <p className="mt-1 text-sm">{profile.data?.email}</p>
                      </div>
                      <label className="block">
                        <span className="label-xs text-muted-foreground">Full name</span>
                        <input required value={form.fullName} onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))} className="field mt-2" />
                      </label>
                      <label className="block">
                        <span className="label-xs text-muted-foreground">Phone</span>
                        <input value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} className="field mt-2" />
                      </label>
                      <p className="label-xs text-muted-foreground">Member since {profile.data && formatDate(profile.data.createdAt)}</p>
                      <button className="btn-solid" disabled={updateProfile.isPending}>
                        {updateProfile.isPending ? "Saving..." : "Save changes"}
                      </button>
                    </form>
                  )}
                </div>
              </Reveal>
            )}

            {tab === "orders" &&
              (orders.isLoading ? (
                <div className="skeleton h-60 w-full" />
              ) : orders.data?.length ? (
                <ul className="border-t">
                  {orders.data.map((o, i) => (
                    <Reveal as="li" key={o.id} delay={i * 80}>
                      <Link to={`/orders/${o.id}`} className="flex flex-wrap items-center justify-between gap-3 border-b py-5 transition-colors hover:bg-muted/50">
                        <div>
                          <p className="label-xs">{o.orderNumber}</p>
                          <p className="mt-2 text-xs text-muted-foreground">{formatDate(o.createdAt)}</p>
                        </div>
                        <StatusPill status={o.orderStatus} />
                        <span className="text-sm">{formatPrice(o.totalAmount, o.currency)}</span>
                      </Link>
                    </Reveal>
                  ))}
                </ul>
              ) : (
                <div className="border py-20 text-center">
                  <h2 className="text-2xl">No orders yet</h2>
                  <p className="mt-3 text-sm text-muted-foreground">Once you place an order, it will show up here.</p>
                </div>
              ))}

            {tab === "addresses" && (
              <div>
                {addresses.isLoading ? (
                  <div className="skeleton h-40 w-full" />
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2">
                    {addresses.data?.map((a, i) =>
                      editing?.id === a.id ? (
                        <div key={a.id} className="hairline-card p-6 sm:col-span-2">
                          <AddressForm
                            initial={a}
                            onCancel={() => setEditing(null)}
                            onSaved={() => {
                              setEditing(null);
                              queryClient.invalidateQueries({ queryKey: ["addresses"] });
                              notify("Address saved", "success");
                            }}
                          />
                        </div>
                      ) : (
                        <Reveal key={a.id} delay={i * 80}>
                          <div className="hairline-card p-6">
                            <p className="label-xs text-accent">
                              {a.addressType} {a.isDefault && "— Default"}
                            </p>
                            <p className="mt-3 text-sm">{a.fullName}</p>
                            <p className="mt-2 text-sm text-muted-foreground">
                              {[a.addressLine1, a.addressLine2].filter(Boolean).join(", ")}, {a.city}, {a.state} {a.postalCode}, {a.country}
                            </p>
                            <p className="label-xs mt-3 text-muted-foreground">
                              {a.phoneCountryCode} {a.phone}
                            </p>
                            <div className="mt-4 flex gap-4">
                              <button className="label-xs link-underline" onClick={() => setEditing(a)}>
                                Edit
                              </button>
                              {!a.isDefault && (
                                <button className="label-xs link-underline" onClick={() => setDefault.mutate(a.id)}>
                                  Set default
                                </button>
                              )}
                              <button className="label-xs link-underline text-destructive" onClick={() => deleteAddress.mutate(a.id)}>
                                Delete
                              </button>
                            </div>
                          </div>
                        </Reveal>
                      )
                    )}
                  </div>
                )}

                {adding ? (
                  <div className="hairline-card mt-8 max-w-md p-6">
                    <p className="label-xs text-accent">Add an address</p>
                    <div className="mt-6">
                      <AddressForm
                        onCancel={() => setAdding(false)}
                        onSaved={() => {
                          setAdding(false);
                          queryClient.invalidateQueries({ queryKey: ["addresses"] });
                          notify("Address added", "success");
                        }}
                      />
                    </div>
                  </div>
                ) : (
                  <button className="btn-outline mt-8" onClick={() => setAdding(true)}>
                    + Add address
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </PageFade>
  );
}

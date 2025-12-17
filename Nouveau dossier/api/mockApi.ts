
// ... (imports existants)
import { db } from '../db';

const logActivity = async (action: string, details: string, userId: string = 'system', userName: string = 'System') => {
    try {
        await db.activityLogs.add({
            timestamp: new Date().toISOString(),
            userId,
            userName,
            action,
            details
        });
    } catch (e) {
        console.error("Failed to log activity", e);
    }
};

export const mockedFetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const url = new URL(input.toString(), window.location.origin);
    const method = init?.method || 'GET';
    // FIX: Initialize body as empty object to prevent destructuring errors if body is missing/null
    let body: any = {}; 
    if (init?.body) {
        try {
            body = JSON.parse(init.body as string);
        } catch (e) {
            console.error("Failed to parse body", e);
        }
    }

    // Artificial delay
    await new Promise(resolve => setTimeout(resolve, 300));

    try {
        // --- AUTH API ---
        if (url.pathname === '/api/login' && method === 'POST') {
            const { userId, password } = body;
            const user = await db.users.get(userId);
            
            if (user && user.password === password) {
                if (!user.isActive) {
                    return new Response(JSON.stringify({ error: 'Compte désactivé' }), { status: 403 });
                }

                // CHECK 2FA
                if (user.isTwoFactorEnabled) {
                    // Simulate sending a code
                    return new Response(JSON.stringify({ 
                        require2FA: true, 
                        userId: user.id,
                        message: "Code 2FA envoyé (Simulation: utilisez 123456)" 
                    }), { status: 200 });
                }

                // Regular Login
                const payload = btoa(JSON.stringify({ id: user.id, role: user.role, name: user.nom }));
                const token = `fakeHeader.${payload}.fakeSignature`;
                
                await logActivity('login_user', 'User logged in', user.id, user.nom);
                return new Response(JSON.stringify({ token, user }), { status: 200 });
            }
            return new Response(JSON.stringify({ error: 'Invalid credentials' }), { status: 401 });
        }

        // --- VERIFY 2FA API ---
        if (url.pathname === '/api/login/verify-2fa' && method === 'POST') {
            const { userId, code } = body;
            const user = await db.users.get(userId);

            if (!user) {
                return new Response(JSON.stringify({ error: 'User not found' }), { status: 404 });
            }

            // Mock Validation: Code must be 123456
            if (code === '123456') {
                const payload = btoa(JSON.stringify({ id: user.id, role: user.role, name: user.nom }));
                const token = `fakeHeader.${payload}.fakeSignature`;
                await logActivity('login_user_2fa', 'User logged in with 2FA', user.id, user.nom);
                return new Response(JSON.stringify({ token, user }), { status: 200 });
            } else {
                return new Response(JSON.stringify({ error: 'Code incorrect' }), { status: 401 });
            }
        }

        // --- USERS API ---
        if (url.pathname === '/api/users') {
            if (method === 'GET') {
                const users = await db.users.toArray();
                return new Response(JSON.stringify(users), { status: 200 });
            }
            if (method === 'POST') {
                const newUser = { ...body, id: body.id || Date.now().toString(), lastUpdated: new Date().toISOString() };
                await db.users.add(newUser);
                await logActivity('create_user', `User created: ${newUser.nom}`);
                return new Response(JSON.stringify(newUser), { status: 201 });
            }
            if (method === 'PUT') {
                await db.users.put({ ...body, lastUpdated: new Date().toISOString() });
                await logActivity('update_user', `User updated: ${body.nom}`);
                return new Response(JSON.stringify(body), { status: 200 });
            }
        }
        
        if (url.pathname.startsWith('/api/users/') && method === 'DELETE') {
             const id = url.pathname.split('/')[3];
             await db.users.delete(id);
             await logActivity('delete_user', `User deleted: ${id}`);
             return new Response(null, { status: 204 });
        }

        // ... (Le reste du fichier reste inchangé - Patients, Interventions, etc.)
        
        // --- PATIENTS API ---
        if (url.pathname === '/api/patients') {
             if (method === 'POST') {
                await db.patients.add(body);
                await logActivity('add_patient', `Patient added: ${body.nom}`);
                return new Response(JSON.stringify(body), { status: 201 });
             }
             if (method === 'PUT') {
                await db.patients.put(body);
                await logActivity('update_patient', `Patient updated: ${body.id}`);
                return new Response(JSON.stringify(body), { status: 200 });
             }
        }
        if (url.pathname.startsWith('/api/patients/') && method === 'DELETE') {
             const id = url.pathname.split('/')[3];
             await db.patients.delete(id);
             await logActivity('delete_patient', `Patient deleted: ${id}`);
             return new Response(null, { status: 204 });
        }

        // --- INTERVENTIONS API ---
        if (url.pathname === '/api/interventions') {
             if (method === 'POST') {
                await db.interventions.add(body);
                await logActivity('create_intervention', `Intervention created for ${body.patientName}`);
                return new Response(JSON.stringify(body), { status: 201 });
             }
             if (method === 'PUT') {
                await db.interventions.put(body);
                await logActivity('update_intervention', `Intervention updated: ${body.id}`);
                return new Response(JSON.stringify(body), { status: 200 });
             }
        }
        if (url.pathname.startsWith('/api/interventions/') && method === 'DELETE') {
             const id = url.pathname.split('/')[3];
             await db.interventions.delete(id);
             await logActivity('delete_intervention', `Intervention deleted: ${id}`);
             return new Response(null, { status: 204 });
        }

        // --- VEHICULES API ---
        if (url.pathname === '/api/vehicules') {
            if(method === 'POST') {
                const newVehicle = {
                    ...body,
                    type: body.type || 'ASSU',
                    brand: body.brand || 'Inconnu',
                    model: body.model || 'Inconnu',
                    status: body.status || 'Disponible',
                    mileage: body.mileage || 0,
                    lastMaintenance: body.lastMaintenance || new Date().toISOString(),
                    nextMaintenance: body.nextMaintenance || new Date().toISOString(),
                    registrationDate: body.registrationDate || '',
                    insuranceExpiry: body.insuranceExpiry || '',
                    technicalVisitExpiry: body.technicalVisitExpiry || '',
                    additionalTracking: body.additionalTracking || ''
                };
                await db.vehicules.put(newVehicle);
                await logActivity('add_vehicule', `Vehicule: ${body.id}`);
                return new Response(JSON.stringify(newVehicle), { status: 201 });
            }
            if(method === 'PUT') {
                await db.vehicules.put(body);
                await logActivity('update_vehicule', `Vehicule updated: ${body.id}`);
                return new Response(JSON.stringify(body), { status: 200 });
            }
        }
        if (url.pathname.startsWith('/api/vehicules/') && method === 'DELETE') {
             const id = url.pathname.split('/')[3];
             await db.vehicules.delete(id);
             await logActivity('delete_vehicule', `Vehicule ID: ${id}`);
             return new Response(null, { status: 204 });
        }

        // Receipts
        if (url.pathname === '/api/receipts') {
            if (method === 'POST') { await db.receipts.add(body); return new Response(JSON.stringify(body), { status: 201 }); }
            if (method === 'PUT') { await db.receipts.put(body); return new Response(JSON.stringify(body), { status: 200 }); }
        }
        if (url.pathname.startsWith('/api/receipts/') && method === 'DELETE') {
            await db.receipts.delete(url.pathname.split('/')[3]); return new Response(null, { status: 204 });
        }

        // Stock
        if (url.pathname === '/api/stock') {
            if (method === 'POST') { await db.stockItems.add(body); return new Response(JSON.stringify(body), { status: 201 }); }
            if (method === 'PUT') { await db.stockItems.put(body); return new Response(JSON.stringify(body), { status: 200 }); }
        }
        if (url.pathname.startsWith('/api/stock/') && method === 'DELETE') {
            await db.stockItems.delete(url.pathname.split('/')[3]); return new Response(null, { status: 204 });
        }

        // Oxygen
        if (url.pathname === '/api/oxygen') {
            if (method === 'POST') { await db.oxygenBottles.add(body); return new Response(JSON.stringify(body), { status: 201 }); }
            if (method === 'PUT') { await db.oxygenBottles.put(body); return new Response(JSON.stringify(body), { status: 200 }); }
        }
        if (url.pathname.startsWith('/api/oxygen/') && method === 'DELETE') {
            await db.oxygenBottles.delete(url.pathname.split('/')[3]); return new Response(null, { status: 204 });
        }

        // Shifts
        if (url.pathname === '/api/shifts') {
            if (method === 'POST') { await db.shifts.add(body); return new Response(JSON.stringify(body), { status: 201 }); }
        }
        if (url.pathname === '/api/shifts/bulk') {
            if (method === 'POST') { await db.shifts.bulkAdd(body); return new Response(JSON.stringify(body), { status: 201 }); }
        }
        
        // Shift Change Request (POST /api/shifts/:id/request-change)
        const shiftRequestMatch = url.pathname.match(/\/api\/shifts\/(\d+)\/request-change/);
        if (shiftRequestMatch && method === 'POST') {
            const shiftId = parseInt(shiftRequestMatch[1], 10);
            const { userId, reason } = body;
            const shift = await db.shifts.get(shiftId);
            if (shift) {
                const updatedShift = {
                    ...shift,
                    changeRequest: {
                        userId,
                        reason,
                        status: 'pending' as 'pending',
                        timestamp: new Date().toISOString()
                    }
                };
                await db.shifts.update(shiftId, updatedShift);
                await logActivity('request_shift_change', `Request for ${shift.date}`);
                return new Response(JSON.stringify(updatedShift), { status: 200 });
            }
            return new Response(JSON.stringify({ error: "Shift not found" }), { status: 404 });
        }

        // Resolve Shift Change (POST /api/shifts/:id/resolve-change)
        const shiftResolveMatch = url.pathname.match(/\/api\/shifts\/(\d+)\/resolve-change/);
        if (shiftResolveMatch && method === 'POST') {
            const shiftId = parseInt(shiftResolveMatch[1], 10);
            const shift = await db.shifts.get(shiftId);
            if (shift && shift.changeRequest) {
                const updatedShift = {
                    ...shift,
                    changeRequest: { ...shift.changeRequest, status: 'resolved' as 'resolved' }
                };
                await db.shifts.update(shiftId, updatedShift);
                await logActivity('resolve_shift_change', `Resolved for ${shift.date}`);
                return new Response(JSON.stringify(updatedShift), { status: 200 });
            }
            return new Response(JSON.stringify({ error: "Shift request not found" }), { status: 404 });
        }

        // Verifications
        if (url.pathname === '/api/verifications') {
            if (method === 'POST') { await db.verifications.add(body); return new Response(JSON.stringify(body), { status: 201 }); }
            if (method === 'PUT') { await db.verifications.put(body); return new Response(JSON.stringify(body), { status: 200 }); }
        }
        if (url.pathname.startsWith('/api/verifications/') && method === 'DELETE') {
            await db.verifications.delete(url.pathname.split('/')[3]); return new Response(null, { status: 204 });
        }

        // Tarifs
        if (url.pathname === '/api/tarifs') {
            if (method === 'POST') { await db.tarifs.add(body); return new Response(JSON.stringify(body), { status: 201 }); }
            if (method === 'PUT') { await db.tarifs.put(body); return new Response(JSON.stringify(body), { status: 200 }); }
        }
        if (url.pathname.startsWith('/api/tarifs/') && method === 'DELETE') {
            await db.tarifs.delete(url.pathname.split('/')[3]); return new Response(null, { status: 204 });
        }

        // Company Info
        if (url.pathname === '/api/company-info') {
            if (method === 'POST') { await db.headerInfo.put(body); return new Response(JSON.stringify(body), { status: 200 }); }
        }

        // Checklists
        if (url.pathname === '/api/checklists/nurse') {
            if (method === 'POST') { await db.nurseChecklistItems.put({ id: 1, items: body }); return new Response(JSON.stringify(body), { status: 200 }); }
        }
        if (url.pathname === '/api/checklists/ambulancier') {
            if (method === 'POST') { await db.ambulancierChecklistItems.put({ id: 1, items: body }); return new Response(JSON.stringify(body), { status: 200 }); }
        }
        if (url.pathname === '/api/checklists/pma') {
            if (method === 'POST') { await db.pmaChecklistItems.put({ id: 1, items: body }); return new Response(JSON.stringify(body), { status: 200 }); }
        }

        // Permissions
        if (url.pathname === '/api/permissions') {
            if (method === 'POST') { await db.permissions.put({ id: 1, permissions: body }); return new Response(JSON.stringify(body), { status: 200 }); }
        }
        
        // Notifications
        if (url.pathname === '/api/notifications') {
            if (method === 'POST') {
                await db.appNotifications.bulkAdd(body);
                return new Response(JSON.stringify(body), { status: 201 });
            }
        }

        // Internal Messages (Secure Chat) & Groups
        if (url.pathname === '/api/messages') {
            if (method === 'POST') {
                const message = {
                    ...body,
                    id: body.id || Date.now().toString(),
                    timestamp: new Date().toISOString(),
                    isRead: false
                };
                await db.internalMessages.add(message);
                return new Response(JSON.stringify(message), { status: 201 });
            }
        }

        // Chat Groups
        if (url.pathname === '/api/chat-groups') {
            if (method === 'POST') {
                const newGroup = {
                    ...body,
                    id: body.id || `group-${Date.now()}`,
                    createdAt: new Date().toISOString()
                };
                await db.chatGroups.add(newGroup);
                return new Response(JSON.stringify(newGroup), { status: 201 });
            }
        }

        // Impediments
        if (url.pathname === '/api/impediments') {
            if (method === 'POST') {
                await db.impediments.add(body);
                return new Response(JSON.stringify(body), { status: 201 });
            }
            if (method === 'DELETE') {
                const { userId, date } = body;
                await db.impediments.where({ userId, date }).delete();
                return new Response(null, { status: 204 });
            }
        }
        
        // Acknowledge Impediment (POST /api/impediments/:id/ack)
        const impAckMatch = url.pathname.match(/\/api\/impediments\/(\d+)\/ack/);
        if (impAckMatch && method === 'POST') {
            const impId = parseInt(impAckMatch[1], 10);
            const impediment = await db.impediments.get(impId);
            if (impediment) {
                await db.impediments.update(impId, { acknowledged: true });
                return new Response(JSON.stringify({ success: true }), { status: 200 });
            }
            return new Response(JSON.stringify({ error: "Impediment not found" }), { status: 404 });
        }
        
        // Taux Salariaux
        if (url.pathname === '/api/taux-salariaux') {
            if (method === 'POST') {
                const existing = await db.tauxSalariaux.where('role').equals(body.role).first();
                if (existing && existing.id) {
                    await db.tauxSalariaux.update(existing.id, body);
                } else {
                    await db.tauxSalariaux.add(body);
                }
                return new Response(JSON.stringify(body), { status: 200 });
            }
        }
        
        // Payslips
        if (url.pathname === '/api/payslips') {
            if (method === 'PUT') { await db.payslips.put(body); return new Response(JSON.stringify(body), { status: 200 }); }
            if (method === 'DELETE') { 
                const id = url.pathname.split('/')[3]; 
            }
        }
        if (url.pathname.startsWith('/api/payslips/') && method === 'DELETE') {
             const id = url.pathname.split('/')[3];
             await db.payslips.delete(id);
             return new Response(null, { status: 204 });
        }
        
        if (url.pathname === '/api/payslips/bulk') {
            if (method === 'POST') {
                const { payslips, period } = body;
                await db.payslips.where('period').equals(period).delete();
                await db.payslips.bulkAdd(payslips);
                return new Response(JSON.stringify(payslips), { status: 201 });
            }
        }

        // Data Reset
        if (url.pathname === '/api/data/reset' && method === 'POST') {
            await (db as any).delete();
            await (db as any).open();
            // Trigger re-population
            window.location.reload(); 
            return new Response(null, { status: 200 });
        }

        // Fallback for unhandled routes
        console.warn(`Unhandled mock API route: ${method} ${url.pathname}`);
        return new Response(null, { status: 404 });

    } catch (error: any) {
        console.error("Mock API Error:", error);
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
};
